# Cadence design system — 12 October 2026

Adapted from the supplied `DESIGN-SPEC.md`, preserved as `Together-design-reference.md`. The document is a visual reference; Together's authentication, account flows, file paths and generation workflow are not Cadence requirements.

The user's explicit typography exception takes precedence: **keep Geist and Geist Mono**, including existing font loading, weights and fallback stacks. Do not introduce DM Serif Display or DM Sans.

## Shared implementation

`public/design-system.css` is the shared theme. The Next.js root layout imports it after existing globals; `public/Cadence.html` loads the same file. The original frozen prototype at `docs/parity/reference/Cadence.html` remains unchanged.

- Cream `#f8f6f2` canvas, navy `#182e44` text/navigation, coral `#ed8b78` primary buttons with navy labels.
- White 18px cards, 14px compact metrics, a navy lead metric, warm and cool contextual surfaces, subtle borders without heavy card shadows.
- Navy active desktop navigation, 48px rows and 20px stroke icons; 232px sidebar, narrowing to 200px below 1150px.
- Existing Cadence mobile destinations retained, with cream translucent chrome, 54px navigation targets and cool selected backgrounds/coral icons. Cadence remains a full-width teaching workspace, rather than a centred 480px relationship app.
- Existing fonts with the reference's larger heading/metric scale; wordmark stays compact enough for the narrow sidebar.
- Coral delivery line/rings, navy mastery series, readable warm text accents, sage positive states, explicit status labels. Canvas waveform reads the current tokens.
- 12px action corners, white 49px fields, peach focus halos, visible keyboard focus, 44px filter pills and larger mobile text fields.
- Cream detail dialogs, 24px corners, blurred navy backdrop, 4.2-second navy toasts, brief motion and reduced-motion suppression. Prototype count/bar/ring animation entry points skip motion when requested.
- Prototype import/insights grids now stack on smaller screens; report metrics use two columns below 600px and long rubric source chips wrap.

## Preview

App: `npm ci`, then `npm run dev` → http://localhost:3000.

Prototype: `python3 -m http.server 3001 --bind 127.0.0.1 --directory public` → http://localhost:3001/Cadence.html. The same prototype is also served by Next.js at http://localhost:3000/Cadence.html.

`CADENCE_DB_PATH=data/cadence-preview.json` isolates the newly restored local clone's synthetic preview. No provider credentials are needed for this styling change.

## Verification

ESLint and a production build passed. The shared stylesheet parses, prototype inline JavaScript parses, and original prototype font-loading links/stacks match exactly. Both preview pages and their stylesheet return HTTP 200. A fresh interactive visual/keyboard audit is still needed; browser automation tools were unavailable during this change. This is not an accessibility certification.
