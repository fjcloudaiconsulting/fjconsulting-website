# Product

## Register

brand

## Users

Three audiences land on the same single page, and the design optimizes for a fast,
unambiguous read rather than pandering to any one of them:

- **Dutch / EU hiring managers** (CTOs, platform leads, engineering managers)
  evaluating a senior contractor for a Kubernetes, cloud, or AI-infrastructure
  engagement. They need to know depth, seniority, and how to make contact.
- **Technical peers and architects** who judge on substance, not marketing. They
  read the specifics (OpenStack, ArgoCD/Flux, GPU clusters, Terraform modules) and
  discount anything that sounds like a brochure.
- **Agencies and recruiters** who skim for capability keywords, legitimacy
  (KvK/BTW registration), and a contact route.

Context of use: a short, skeptical, often mobile visit, usually arriving from a
LinkedIn profile, an email signature, or a referral. The visitor has already been
told "this person is good" and is checking whether the evidence holds up. The job
to be done is *decide whether to start a conversation*, in under a minute.

## Product Purpose

A single-page marketing site for FJ Cloud & AI Consulting, a Netherlands-based
cloud, Kubernetes, and AI-infrastructure consultancy that currently has no web
presence. It exists to convert an already-warm visitor into an email or a call.

The site is also a working demonstration of the practice it sells: statically
built, infrastructure-as-code provisioned, CI/CD deployed, fast, and accessible.
Build quality is part of the argument. A slow or sloppy site would actively
contradict the pitch.

Success looks like: a visitor understands what Flamarion does, at what seniority,
and how to reach him, within one screen and one scroll, and the whole thing loads
in well under a second.

## Brand Personality

Senior, vendor-neutral, and pragmatic. The voice of someone who has actually run
these platforms in production, has no product to sell, and is calm about hard
problems. Specific over enthusiastic: name the technology, describe the work,
skip the adjectives.

Tone rules:
- Concrete nouns and verbs. "Runs OpenStack in production" beats "delivers
  world-class private cloud solutions."
- No marketing buzzwords, no "digital transformation", no "empower/streamline/
  seamless/enterprise-grade".
- Never overclaim. No invented client logos, no fabricated uptime metrics, no
  "trusted by" bars. Everything on the page must be literally true.
- Confident, not loud. The restraint is the signal of seniority.

## Anti-references

All four were explicitly ruled out by the owner:

- **Generic SaaS landing page.** No gradient blobs, no hero-metric template
  (big number + small label), no fake logo cloud, no "Trusted by" bar, no
  three-tier pricing table.
- **Big-4 consultancy.** No stock photography of people in meetings, no vague
  transformation copy, no corporate blue, no buzzword soup.
- **Crypto / AI hype site.** No neon glow, no particle fields, no electric
  accents, no "the future of" copy, no excessive motion.
- **Sparse dev portfolio.** No terminal aesthetic, no monospace-everything, no
  README-as-a-website. Too casual to support senior consulting rates.

Category-reflex warning specific to this project: the logo commits the palette to
navy and gold, which is *also* the single most templated combination in
consulting and fintech. Identity preservation wins on the palette, so the
differentiation must come from execution: typographic structure, restraint in how
gold is spent, and the deliberate absence of an icon-card grid. If the page could
be mistaken for a template with the colors swapped in, it has failed.

## Design Principles

1. **The build is the portfolio.** Every technical decision on this site is
   evidence for the services it sells. Performance, accessibility, and IaC rigor
   are not polish, they are the argument.
2. **Specific beats impressive.** Name the actual technologies and the actual
   work. Vagueness reads as inexperience to the one audience that matters most.
3. **Spend gold like currency.** The accent carries meaning (calls to action,
   the one thing that matters in a section) and never decorates. Under 10% of any
   viewport. Never as gradient text.
4. **Structure over ornament.** Hierarchy comes from type scale, weight, and
   hairline rules, not from boxes. Cards are the lazy answer here; a dense,
   confident typographic list says "engineer" where six identical cards say
   "template".
5. **Nothing on the page is untrue.** No placeholder credibility, no invented
   proof. An honest short page outperforms a padded one for this audience.

## Accessibility & Inclusion

Target: **WCAG 2.2 AA**, verified rather than assumed.

- Body text at or above 4.5:1 contrast; large text at or above 3:1. The muted
  secondary color and the gold accent are both measured against the navy
  backgrounds, not eyeballed.
- Full keyboard navigation with visible, high-contrast focus rings. No focus
  traps, and a skip-to-content link.
- Semantic landmarks and a single logical heading order.
- `prefers-reduced-motion: reduce` honoured for every animation, with a crossfade
  or instant fallback. Content is never gated behind a reveal transition.
- Color is never the sole carrier of meaning.
- Form fields have persistent visible labels, programmatic association, and error
  messages that state what to do, not just what went wrong.
- Respects `prefers-contrast` where it can improve legibility.
