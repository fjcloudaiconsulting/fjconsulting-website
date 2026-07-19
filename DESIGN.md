# Design

The visual system for the FJ Cloud & AI Consulting site. Strategy, audience and
principles live in [PRODUCT.md](./PRODUCT.md); this file is how it looks.

Tokens are defined once in [`src/styles/tokens.css`](./src/styles/tokens.css)
and are the only place colour, type, spacing and motion values are authored.

## Theme

**Dark, by commitment rather than default.** The scene: a hiring manager or
architect opening a referral link on a laptop, mid working day, alongside an IDE
and a terminal. The logo is drawn for a navy field, and the gold does not reach
4.5:1 on white, so a light inversion would strand the brand's only accent. There
is no light variant to maintain.

## Colour

Anchored to the logo and expressed in OKLCH. Neutrals are tinted toward the
brand's own blue hue (H ~264) rather than a default warm or cool, so the greys
belong to this brand.

**Strategy: restrained.** Tinted navy neutrals carry the surface; gold appears on
well under 10% of any viewport.

| Token | Role |
| --- | --- |
| `--bg` | Page field. The deepest navy; the site is drenched in it. |
| `--surface` | Raised: nav when stuck, hovered rows, form fields, footer. |
| `--surface-hi` | Hover on an already-raised surface. |
| `--ink` | Primary text. |
| `--ink-muted` | Secondary prose. Lifted above the logo's `#9AA4B8` to clear 4.5:1. |
| `--ink-faint` | Mono labels and metadata only. Never body prose. |
| `--gold` / `--gold-hi` | The accent. CTAs, one emphasis per section, the status dot. |
| `--line` / `--line-strong` | Hairlines. These carry the structure that cards would otherwise carry. |

### Rules

- **Gold is currency.** It marks the primary action, the one phrase in the hero
  that carries the positioning, and section markers in the approach list.
  Nothing else. Never as a gradient clipped to text.
- **Contrast is verified, not assumed.** `scripts/check-contrast.mjs` asserts
  every real foreground/background pair against its WCAG 2.2 requirement,
  reading the values straight out of `tokens.css`, and runs in CI. Changing a
  token to something illegible fails the build.
- `prefers-contrast: more` strengthens hairlines and lifts muted ink instead of
  repainting the palette.

## Typography

Two families on a genuine contrast axis, 50KB total, self-hosted latin subsets
preloaded from `public/fonts/`.

| Family | Role |
| --- | --- |
| **Archivo Variable** | Everything readable. One variable file covers 100–900. |
| **IBM Plex Mono** | Technical metadata only: stack lines, field labels, registration details. |

### Rules

- Modular scale, roughly 1.25 at text sizes widening to ~1.4 at display sizes,
  so hierarchy is obvious rather than flat.
- Display ceiling `4.75rem`, comfortably under the 6rem shouting threshold.
  Letter-spacing floor `-0.035em`.
- `text-wrap: balance` on headings, `pretty` on prose. Measure capped at 68ch.
- Mono is for short labels. Technology names keep their real casing:
  uppercasing "Weights & Biases" or "Argo CD" would make them harder to read,
  not more designed.
- No uppercase eyebrow above sections. Hierarchy comes from scale and hairlines.

## Layout

- Single page, sticky nav, `--max-w: 76rem`, fluid `--gutter`.
- Section rhythm deliberately varies (`--section-y` vs `--section-y-tight`)
  rather than repeating one value.
- **No card grid.** Services are full-width rows separated by hairlines, with
  the title holding a left rail from 52rem up. Six identical boxes would read as
  a template; a dense list reads as someone who knows the subject.
- Asymmetric two-column splits for About and Contact, not centred blocks.
- Small radii (3–5px). Pill shapes are reserved for the one status badge.
- Semantic z-index scale, no arbitrary values.

## Motion

Exponential ease-out only, no bounce or elastic.

Reveals are **strictly additive and fail open**, which matters more than it
sounds. Content is visible by default; the hidden state is scoped to
`[data-motion="on"]`, set by an inline head script only when JS runs and motion
is allowed. On top of that, if IntersectionObserver produces no callback shortly
after setup, the script drops `data-motion` entirely rather than adding a reveal
class, because in a context where the observer is inert CSS transitions are
frozen too and the class would never animate anything back.

That combination is what keeps the page from shipping blank to background tabs,
headless renderers and social-preview scrapers. `scripts/check-build.mjs`
asserts the real copy is present in the static HTML so a regression here fails
CI rather than reaching production.

`prefers-reduced-motion: reduce` removes all of it, including smooth scrolling.

## Accessibility

Target **WCAG 2.2 AA**, verified. See PRODUCT.md for the full commitment.
Practical rules that shape the visuals:

- One focus treatment sitewide: a 2px gold ring at 3px offset, verified above
  3:1 on both surfaces.
- Visible persistent labels on every field. No placeholder-as-label.
- Interactive targets at least 2.75rem tall.
- Colour never the sole carrier of meaning: the availability dot is accompanied
  by its own text.

## Anti-patterns, explicitly

Banned in this codebase: gradient text, side-stripe borders, decorative
glassmorphism, hero-metric templates, identical card grids, uppercase tracked
eyebrows above every section, and numbered markers used as scaffolding. The
approach list is numbered because it is genuinely a sequence and the order
carries meaning; it is the only numbered thing on the page.
