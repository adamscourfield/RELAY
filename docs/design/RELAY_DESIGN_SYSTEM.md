# RELAY design system (green)

Adapted from the supplied "Simply Homework" product design guide, kept as `Simply-Homework-design-reference.md`. The guide is a visual reference: its name, brand and wording are not reproduced. RELAY keeps its own name, copy and navigation.

Supersedes [CADENCE_DESIGN_SYSTEM.md](CADENCE_DESIGN_SYSTEM.md) for the app. That file and `public/design-system.css` still describe the frozen prototype at `/Cadence.html`, which is deliberately unchanged.

## Where it lives

- `src/app/globals.css`: tokens (surfaces, text, lines, data hues, radii, layout sizes), base typography, and the primitives `.glass` `.eyebrow` `.btn` `.field` `.chip`.
- `src/app/relay-design.css`: shell (246px sidebar, 76px top bar with breadcrumb, mobile tab bar) and feature layouts.
- Old token names (`--lime`, `--cyan`, `--amber`, `--violet`, `--muted`...) are aliases onto the new roles so existing components recolour without edits. Prefer the role names (`--brand`, `--data-mid`, `--text-secondary`) in new code.
- Fonts: DM Sans (body) and Manrope (headings), self-hosted through `@fontsource-variable/*`, so builds do not need Google Fonts. Georgia italic is used once, on the Overview welcome phrase.

## Deviations from the guide, and why

The guide's own values fail WCAG in places, so these were darkened. Everything else follows the guide.

| Role | Guide | RELAY | Reason |
| --- | --- | --- | --- |
| Secondary text | `#727e66` | `#5c6a51` | 4.3:1 on white and 3.8:1 on sage panels; needs 4.5:1 |
| Form control border | `#dfe6d4` | `#7a8b6b` | 1.25:1; non-text boundaries need 3:1 |
| Warning text | `#8c7e57` | `#7a6a3a` | 3.6:1 on its own warm banner |

Data colours (`--data-deep`, `--data-mid`, `--data-caution`, `--data-student`, `--data-quiet`) are RELAY's own choices, checked for contrast and for deuteranopia. Colour is always paired with a label, value or position.

## Rules

- Flat surfaces: no gradients, glows or heavy shadows (only the dialog and toast use one).
- Radii: 6 controls, 8 nested panels, 10 panels, 12 dialogs.
- Minimum 44px touch targets on buttons and inputs; smallest text is 11px (eyebrows) and 12px elsewhere.
- Focus: 2px `--focus` outline on every interactive element.
- Motion respects `prefers-reduced-motion`.

## Checking

An automated audit of rendered text on the eight main pages found no text below 4.5:1 (3:1 for large text). Re-run it after changing tokens.
