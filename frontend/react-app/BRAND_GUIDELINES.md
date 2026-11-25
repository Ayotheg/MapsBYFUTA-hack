# Maps By FUTA — Brand Guidelines (Hackathon Rebuild)

All UI in this project uses the tokens in `src/styles/tokens.css` and CDN fonts loaded in `index.html`. Never introduce unapproved hex colours or unapproved font families.

## 1. Colour Palette (17 Brand Colours)

| Token Name | Hex / Value | CSS Variable | Intended Use |
| --- | --- | --- | --- |
| `primary` | `#7c3aed` | `--color-primary` | Primary buttons, active tabs, links, icon badges |
| `primary-hover` | `#6d28d9` | `--color-primary-hover` | Hover/pressed primary fills; violet text on `primary-tint` |
| `primary-tint` | `#ede9fe` | `--color-primary-tint` | Pale violet fills: badges, pills, selected rows |
| `white` | `#ffffff` | `--color-white` | Text on primary/secondary/ink/error; card & modal surfaces |
| `ink` | `#0f172a` | `--color-ink` | Headings, inverted button fill |
| `text` | `#4a4455` | `--color-text` | Body text |
| `text-muted` | `#6b6478` | `--color-text-muted` | Captions, placeholders, secondary text |
| `surface` | `#f8f9ff` | `--color-surface` | Page / app background |
| `surface-alt` | `#f2f3ff` | `--color-surface-alt` | Inputs, dropzones, banners, HUD strips |
| `border` | `#e2e8f0` | `--color-border` | Borders and dividers |
| `scrim` | `rgba(15, 23, 42, 0.4)` | `--color-scrim` | Modal / sheet backdrop |
| `secondary` | `#0d9488` | `--color-secondary` | Brand teal: secondary actions, switches, success, destination pins |
| `secondary-light` | `#6bd8cb` | `--color-secondary-light` | Light teal accent fill (never text on white) |
| `secondary-tint` | `#e6f6f4` | `--color-secondary-tint` | Pale teal fill behind teal/ink content |
| `error` | `#ba1a1a` | `--color-error` | Destructive buttons, error text/icons |
| `error-tint` | `#fff8f7` | `--color-error-tint` | Destructive hover, error banners |
| `star` | `#ffc857` | `--color-star` | Filled rating star icons (icon fill only, never text) |

### Surface & Contrast Rules
- **Pages**: `--color-surface`; **Cards / Modals**: `--color-white` with `1px solid var(--color-border)`.
- **Typography colours**: Headings `--color-ink`, body `--color-text`, captions `--color-text-muted`.
- **Buttons**:
  - Primary (`.btn-primary`): `--color-primary` fill, `--color-white` text, `--color-primary-hover` on hover.
  - Secondary (`.btn-secondary`): `--color-primary-tint` fill, `--color-primary-hover` text.
  - Inverted (`.btn-inverted`): `--color-ink` fill, `--color-white` text.
  - Outlined (`.btn-outline`): `--color-white` fill, `--color-border` edge, `--color-ink` text.
- **Contrast guardrails**:
  - White text on `secondary` (~3.7:1) and teal text on `secondary-tint` (~3.4:1) are for **bold 19px+ text only**.
  - Never use `--color-star` as text.

## 2. Typography (CDN Fonts)

| Role | Font Family | CSS Variable |
| --- | --- | --- |
| Headlines | Bricolage Grotesque | `--font-display` |
| UI, body, labels, inputs, buttons | Inter | `--font-ui` |
| Numbers, coordinates, distances, ETAs, status pills | Manrope | `--font-numeric` |
| Approved alternates | Plus Jakarta Sans, Geist, Satoshi, DM Mono | `--font-jakarta`, `--font-geist`, `--font-satoshi`, `--font-mono` |

- Pair `--font-numeric` (or `.tabular-nums`) with `font-variant-numeric: tabular-nums` whenever numbers update or align in columns.
- Type scale guidelines:
  - Modal title: `24px / 32px`, weight `600` (`--font-display`)
  - Panel title: `17px / 1.2`, weight `700` (`--font-display`)
  - Button: `14px`, weight `600`, `0.14px` tracking (`--font-ui`)
  - Item title: `14px`, weight `600` (`--font-ui`)
  - Body: `16px / 24px` (`--font-ui`)
  - Small body: `12px / 1.35` (`--font-ui`)
  - Overline: `11px`, weight `500`, `0.1em` tracking, uppercase (`--font-ui`)

## 3. Icons & Replaceable Images

- **Icons**: `lucide-react` (default `24x24`, `strokeWidth={2}`, round caps/joins).
- **Replaceable Images**: Drop assets into `public/images/` (see `public/images/README.md`).
  - Use `<BrandLogo variant="lockup" | "mark" tone="light" | "dark" />` for logos.
  - Use `<FallbackImage src="/images/..." alt="..." />` for photos/illustrations so missing files gracefully render a branded fallback placeholder.
