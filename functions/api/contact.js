/**
 * POST /api/contact — contact form delivery.
 *
 * A standalone Cloudflare Pages Function. The site itself stays a pure static
 * build (no adapter, no SSR); Cloudflare resolves this file as a route next to
 * dist/, which is why it lives here and not under src/.
 *
 * Plain JavaScript on purpose: tsconfig.json type-checks `**\/*.ts` against
 * Astro's browser types, so a .ts file here would be checked against the wrong
 * globals, and `node --test` runs .js with no build step and no dependencies.
 *
 * Request:  multipart or urlencoded form body (the browser's own FormData).
 * Response: always JSON `{ ok, error? }`. The form requires JavaScript; the
 *           page keeps a plain mailto: link for visitors without it.
 *
 * Environment (Pages project → Settings → Variables and Secrets):
 *   MAILGUN_API_KEY   secret, required
 *   MAILGUN_DOMAIN    the verified Mailgun sending domain, required
 *   CONTACT_TO        destination inbox, required
 *   MAILGUN_API_BASE  optional; defaults to the EU region
 *   TURNSTILE_SECRET_KEY  optional; when unset, Turnstile is not enforced
 *
 * Until the three required values are set the endpoint answers 503
 * `not_configured` rather than pretending to have sent anything.
 */

/** Mailgun's EU region. A US-region domain needs api.mailgun.net instead. */
const DEFAULT_API_BASE = 'https://api.eu.mailgun.net/v3';

/** Field caps. Generous for humans, and a bound on what reaches Mailgun. */
const LIMITS = { name: 100, email: 254, message: 4000 };

/**
 * Deliberately permissive: one @, a dot in the domain, no spaces. Stricter
 * patterns reject real addresses, and the only thing that truly validates an
 * address is delivering to it.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

/** Trim, collapse newlines out of single-line fields, and cap the length. */
const clean = (value, max, singleLine = true) => {
  const text = typeof value === 'string' ? value : '';
  const flat = singleLine ? text.replace(/[\r\n]+/g, ' ') : text;
  return flat.trim().slice(0, max);
};

/** Cloudflare's server-side check that the widget was really solved. */
async function turnstileOk(secret, token, ip) {
  if (!token) return false;
  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body },
  );
  if (!res.ok) return false;
  const result = await res.json();
  return result.success === true;
}

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Honeypot. A field no human sees and no real submission fills. Answered with
  // a plain success so a bot learns nothing about why it failed.
  if (clean(form.get('company_url'), 200) !== '') {
    console.warn('contact: honeypot filled, dropped');
    return json({ ok: true });
  }

  const name = clean(form.get('name'), LIMITS.name);
  const email = clean(form.get('email'), LIMITS.email);
  const message = clean(form.get('message'), LIMITS.message, false);

  if (!name || !EMAIL.test(email) || message.length < 10) {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  // Enforced only once the secret exists, so the form can ship and work on the
  // honeypot alone while the widget is still being provisioned.
  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await turnstileOk(
      env.TURNSTILE_SECRET_KEY,
      clean(form.get('cf-turnstile-response'), 2048),
      request.headers.get('cf-connecting-ip'),
    );
    if (!ok) return json({ ok: false, error: 'challenge_failed' }, 400);
  }

  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, CONTACT_TO } = env;
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !CONTACT_TO) {
    console.error('contact: delivery is not configured');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const body = new URLSearchParams({
    // Envelope sender must be on the verified Mailgun domain; the visitor's
    // address goes in Reply-To so replying works without forging the From.
    from: `FJ Consulting website <website@${MAILGUN_DOMAIN}>`,
    to: CONTACT_TO,
    'h:Reply-To': `${name} <${email}>`,
    subject: `Website enquiry from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}\n`,
  });

  const base = (env.MAILGUN_API_BASE ?? DEFAULT_API_BASE).replace(/\/$/, '');
  let res;
  try {
    res = await fetch(`${base}/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  } catch (err) {
    console.error('contact: Mailgun request failed', err);
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  if (!res.ok) {
    // Logged for the Workers tail, never returned: the body can echo the
    // sending domain and key state.
    console.error(`contact: Mailgun returned ${res.status}`, await res.text());
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true });
}
