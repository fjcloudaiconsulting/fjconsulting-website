/*
 * Fences for functions/api/contact.js.
 *
 *   node --test scripts/contact.test.mjs
 *
 * No test framework and no dependencies: node:test plus the real WHATWG
 * Request/FormData that Workers also implement. The test lives here rather than
 * beside the function because every file under functions/ becomes a public
 * route, and functions/api/contact.test.js would publish one.
 *
 * Each case names the wrong implementation it kills, because a test that
 * survives every plausible mistake is decoration.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';

const ENV = {
  MAILGUN_API_KEY: 'key-test',
  MAILGUN_DOMAIN: 'mg.example.test',
  CONTACT_TO: 'inbox@example.test',
};

const VALID = {
  name: 'Aria Engineer',
  email: 'aria@example.test',
  message: 'We need help sizing a GPU cluster for training.',
};

/** A POST carrying a browser-shaped form body. */
function post(fields) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return new Request('https://fjconsulting.dev/api/contact', {
    method: 'POST',
    body,
    headers: { 'cf-connecting-ip': '203.0.113.7' },
  });
}

/**
 * Runs the handler with fetch replaced. Returns the response plus every
 * outbound call, so "did it actually send" is asserted rather than assumed.
 */
async function run(fields, env = ENV, reply = () => new Response('{}', { status: 200 })) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return reply(String(url), init);
  };
  try {
    const res = await onRequestPost({ request: post(fields), env });
    return { res, body: await res.json(), calls };
  } finally {
    globalThis.fetch = original;
  }
}

const mailgunCalls = (calls) => calls.filter((c) => c.url.includes('mailgun'));

test('a valid submission is delivered to Mailgun', async () => {
  const { res, body, calls } = await run(VALID);

  assert.equal(res.status, 200);
  assert.deepEqual(body, { ok: true });

  // Kills: never calling Mailgun at all, and calling the wrong region/domain.
  assert.equal(mailgunCalls(calls).length, 1);
  const [call] = mailgunCalls(calls);
  assert.equal(
    call.url,
    'https://api.eu.mailgun.net/v3/mg.example.test/messages',
  );

  // Kills: omitting Basic auth, or sending the key in the clear.
  assert.equal(
    call.init.headers.authorization,
    `Basic ${Buffer.from('api:key-test').toString('base64')}`,
  );

  // Kills: forging From as the visitor (Mailgun rejects it and SPF fails), and
  // dropping Reply-To so a reply goes nowhere useful.
  const sent = new URLSearchParams(call.init.body.toString());
  assert.equal(sent.get('from'), 'FJ Consulting website <website@mg.example.test>');
  assert.equal(sent.get('to'), 'inbox@example.test');
  assert.equal(sent.get('h:Reply-To'), 'Aria Engineer <aria@example.test>');
  assert.match(sent.get('text'), /GPU cluster/);
});

test('MAILGUN_API_BASE overrides the region', async () => {
  // Kills: hardcoding the EU host, which silently 404s a US-region domain.
  const { calls } = await run(VALID, {
    ...ENV,
    MAILGUN_API_BASE: 'https://api.mailgun.net/v3/',
  });
  assert.equal(
    mailgunCalls(calls)[0].url,
    'https://api.mailgun.net/v3/mg.example.test/messages',
  );
});

test('a filled honeypot is dropped without sending', async () => {
  // Kills: reading the honeypot but still sending, and rejecting loudly enough
  // for a bot to learn which field betrayed it.
  const { res, body, calls } = await run({
    ...VALID,
    company_url: 'http://spam.example',
  });
  assert.equal(res.status, 200);
  assert.deepEqual(body, { ok: true });
  assert.equal(mailgunCalls(calls).length, 0);
});

test('incomplete or malformed submissions are rejected', async () => {
  const cases = [
    ['missing name', { ...VALID, name: '' }],
    ['whitespace name', { ...VALID, name: '   ' }],
    ['missing email', { ...VALID, email: '' }],
    ['email without a domain dot', { ...VALID, email: 'aria@example' }],
    ['email with a space', { ...VALID, email: 'aria @example.test' }],
    ['message too short', { ...VALID, message: 'hi' }],
    ['no fields at all', {}],
  ];

  for (const [label, fields] of cases) {
    const { res, body, calls } = await run(fields);
    assert.equal(res.status, 400, label);
    assert.equal(body.error, 'invalid', label);
    // Kills: validating, logging the failure, and sending anyway.
    assert.equal(mailgunCalls(calls).length, 0, label);
  }
});

test('Turnstile is enforced when the secret is set', async () => {
  const env = { ...ENV, TURNSTILE_SECRET_KEY: 'secret' };

  // Kills: treating a missing token as a pass.
  {
    const { res, body, calls } = await run(VALID, env);
    assert.equal(res.status, 400);
    assert.equal(body.error, 'challenge_failed');
    assert.equal(mailgunCalls(calls).length, 0);
  }

  // Kills: calling siteverify and ignoring `success: false`.
  {
    const { res, calls } = await run(
      { ...VALID, 'cf-turnstile-response': 'token' },
      env,
      (url) =>
        url.includes('siteverify')
          ? new Response(JSON.stringify({ success: false }), { status: 200 })
          : new Response('{}', { status: 200 }),
    );
    assert.equal(res.status, 400);
    assert.equal(mailgunCalls(calls).length, 0);
  }

  // A solved challenge passes through, and the visitor's IP is forwarded.
  {
    const { res, calls } = await run(
      { ...VALID, 'cf-turnstile-response': 'token' },
      env,
      (url) =>
        url.includes('siteverify')
          ? new Response(JSON.stringify({ success: true }), { status: 200 })
          : new Response('{}', { status: 200 }),
    );
    assert.equal(res.status, 200);
    assert.equal(mailgunCalls(calls).length, 1);

    const verify = calls.find((c) => c.url.includes('siteverify'));
    assert.equal(verify.init.body.get('secret'), 'secret');
    assert.equal(verify.init.body.get('response'), 'token');
    assert.equal(verify.init.body.get('remoteip'), '203.0.113.7');
  }
});

test('Turnstile is skipped when no secret is configured', async () => {
  // Kills: requiring a token unconditionally, which would break the form
  // between this PR landing and the widget being provisioned.
  const { res, calls } = await run(VALID, ENV);
  assert.equal(res.status, 200);
  assert.equal(calls.filter((c) => c.url.includes('siteverify')).length, 0);
});

test('missing delivery config answers 503, not a fake success', async () => {
  // Kills: returning ok:true when nothing was sent — the failure mode where a
  // lead silently disappears.
  for (const key of ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'CONTACT_TO']) {
    const env = { ...ENV, [key]: undefined };
    const { res, body, calls } = await run(VALID, env);
    assert.equal(res.status, 503, key);
    assert.equal(body.error, 'not_configured', key);
    assert.equal(mailgunCalls(calls).length, 0, key);
  }
});

test('a Mailgun failure is reported as a failure', async () => {
  // Kills: ignoring res.ok, which would report success on a rejected send.
  const { res, body } = await run(VALID, ENV, () =>
    new Response('{"message":"key mismatch"}', { status: 401 }),
  );
  assert.equal(res.status, 502);
  assert.equal(body.error, 'send_failed');
  // Kills: echoing Mailgun's body, which names the sending domain and key state.
  assert.equal(JSON.stringify(body).includes('key mismatch'), false);
});

test('a network error is reported as a failure, not a crash', async () => {
  // Kills: an unhandled rejection, which Pages surfaces as a bare 500.
  const { res, body } = await run(VALID, ENV, () => {
    throw new Error('ECONNRESET');
  });
  assert.equal(res.status, 502);
  assert.equal(body.error, 'send_failed');
});

test('a non-form body is a 400, not a 500', async () => {
  const res = await onRequestPost({
    request: new Request('https://fjconsulting.dev/api/contact', {
      method: 'POST',
      body: 'not a form',
      headers: { 'content-type': 'application/json' },
    }),
    env: ENV,
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'bad_request');
});

test('field lengths are capped before they reach Mailgun', async () => {
  // Kills: passing an unbounded body straight through to the API.
  const { calls } = await run({
    ...VALID,
    name: 'n'.repeat(500),
    message: 'm'.repeat(9000),
  });
  const sent = new URLSearchParams(mailgunCalls(calls)[0].init.body.toString());
  assert.equal(sent.get('subject').includes('n'.repeat(101)), false);
  assert.ok(sent.get('text').length < 4300);
});

test('a newline cannot be injected into the subject header', async () => {
  // Kills: interpolating a raw name into a header. Mailgun takes these as form
  // fields rather than raw headers, but the collapse is the actual guard and it
  // must stay asserted.
  const { calls } = await run({
    ...VALID,
    name: 'Aria\r\nBcc: attacker@example.test',
  });
  const sent = new URLSearchParams(mailgunCalls(calls)[0].init.body.toString());
  assert.equal(/[\r\n]/.test(sent.get('subject')), false);
  assert.equal(/[\r\n]/.test(sent.get('h:Reply-To')), false);
});
