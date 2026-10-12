# Together — design specification

Version: 1.0 · 12 October 2026

This describes the implemented web prototype, including the customer app, landing/sign-in flow and desktop administration. Values are CSS pixels. It is a reference for maintaining the current visual identity, not a claim that accessibility or production readiness has been independently certified.

## 1. Design direction

Together should feel warm, calm and personal: a thoughtful shared space for two people. Use editorial serif headings, clear sans-serif controls, cream backgrounds, navy text and restrained coral accents. Rounded white cards provide structure without making every surface look like a button.

The customer app is mobile first, even when viewed on a desktop. Administration is Mac/PC first: persistent navigation, wide charts, dense summaries, searchable tables and keyboard access. Both share the same brand, fonts and palette.

Keep language short and conversational. Explain the benefit before requesting sign-up. Keep primary actions obvious, and move secondary management actions into detail views when a card becomes crowded.

## 2. Colour system

### Shared core tokens

| Token | Value | Use |
| --- | --- | --- |
| `--navy` | `#182e44` | Main text, active navigation, dark cards, primary dark buttons |
| `--coral` | `#ed8b78` | Main call-to-action fill, logo dot, interaction accents |
| `--cream` | `#f8f6f2` | App canvas, admin canvas, dialog background |
| `--muted` | `#71808c` | Supporting copy and metadata |
| `--line` | `#e6e5df` | Card outlines, dividers and table rules |
| White | `#ffffff` | Cards, inputs, light buttons |
| Outer canvas | `#e4e8eb` | Space around the centred customer app |

### Supporting colours currently used

| Value | Use |
| --- | --- |
| `#ca715f` | Italic accent words in headings |
| `#f0b4a6` | Customer avatar and input focus outline |
| `#e9eeef` | Active customer navigation background |
| `#ce705f` | Active customer navigation icon |
| `#e9eeed` | Partner summary panel |
| `#f5e5dc` / `#efd9cc` | Warm rhythm card and missed-plan summary fill/border |
| `#e7eeee` / `#dbe6e6` | Cool rhythm card fill/border |
| `#ecefe8` | Home introduction panel |
| `#eef2f3` | Informational notices and chart tracks |
| `#e8f0e9` / `#4f6c55` | Positive status badge fill/text |
| `#f9e7df` / `#98614f` | Waiting status badge fill/text |
| `#f8ece7` | Special-date calendar badge |
| `#b25344` | Customer destructive action text |
| `#b7c8d6` | Supporting text on navy cards |

Use colour together with explicit status text. A missed plan is labelled, rather than communicated only by a peach background. Do not assume all muted small text combinations meet every contrast requirement; check contrast when changing size, weight or background.

## 3. Typography

Fonts are loaded from Google Fonts with `display=swap`.

```css
--serif: 'DM Serif Display', Georgia, serif;
--sans: 'DM Sans', system-ui, sans-serif;
```

DM Sans loads weights 400, 500, 600 and 700. DM Serif Display loads regular and italic. Use the serif at regular weight; italic emphasised words use the warm heading accent, not a heavy synthetic bold.

| Element | Customer app | Admin |
| --- | --- | --- |
| Base text | 15px DM Sans | 14px DM Sans, line-height 1.6 |
| Wordmark | 32px serif, tracking −1.2px | 34px serif, tracking −1.2px |
| Main heading | 34px / 1.13, tracking −0.7px | 40px / 1.15, tracking −0.8px |
| Home heading | 38px; tracking inherited | Main heading scale |
| Landing hero | 42px / 1.12 | Not applicable |
| Account-flow heading | 40px / 1.13, tracking −1px | Not applicable |
| Section heading | Typically 23–25px serif | 27px / 1.2 serif |
| Memory title | 27px serif | Detail heading 23px serif |
| Special-date title | 28px / 1.2, tracking −0.4px | Not applicable |
| Compact metric value | Not applicable | 30px / 1.15 serif |
| Button | Typically 13px, weight 600 | Typically 12px |
| Field label | 12px, weight 600 | Small sans-serif control label |
| Input value | 16px | Inherits admin control styling |
| Metadata | Usually 10–12px | Usually 10–12px |
| Eyebrow | 10px, uppercase, tracking 1.7px | Small uppercase navigation label |

Long user-entered titles must wrap. Preserve hierarchy through size and spacing rather than adding extra colours or all-cap headings everywhere.

## 4. Spacing, shapes and surfaces

The current CSS uses contextual values rather than a single enforced spacing scale. Common values are 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28 and 32px. Match the component being extended rather than normalising all of these without a design review.

| Component | Padding / gap | Radius |
| --- | --- | --- |
| Customer standard panel | 22px; margin 17px vertically | 16px |
| Rhythm card | 17px 18px 12px; grid gap 12px | 17px |
| Customer button | 13px 18px; icon gap 9px | 12px |
| Customer form columns | 12px gap | — |
| Input | 12px padding; minimum height 49px | 10px |
| Notice | 14px padding | 10px |
| Special-date card | 24px padding | 20px |
| Memory card | Body padding 22px; grid gap 18px | 17px |
| Admin chart / panel | 24px padding; chart grid gap 24px | 18px |
| Admin compact metric | 16px 14px; grid gap 10px | 14px |
| Admin record dialog | Header 24px 32px; body 28px 32px | 24px |
| Admin table toolbar | 20px gap; 16px bottom margin | Inherits panel |

Borders are normally 1px. Shadows are subtle: the customer shell uses `0 0 80px #182e4412`, while raised button hover uses `0 7px 18px #182e4412`. Do not add strong shadows to all cards. Translucent sticky chrome uses 18px backdrop blur; dialog backdrops use 4px blur.

## 5. Customer app layout

### Shell and navigation

- App body is centred and capped at 480px, with `min-height:100dvh`.
- Content has 22px horizontal gutters and bottom clearance of `105px + safe-area-inset-bottom`.
- Sticky top bar uses cream at partial opacity, 18px blur, 22px horizontal padding and safe-area-aware top padding.
- Logo is left aligned. Notification control and 34px round initials avatar sit on the right with a 10px gap.
- Bottom navigation is fixed, centred and capped at 480px. Four equal items: Home, Plans, Memories and Us.
- Navigation items stack a 21px line icon above a 10px label. Minimum item height is 54px, with a 13px active background radius.
- Selected item uses navy text, pale cool fill and a coral-toned icon.

### Home and plans

Home uses a serif heading, a short contextual introduction, three rhythm cards and upcoming plans. Rhythm cards use navy, warm peach and cool grey-green surfaces. Dates, nights away and holidays remain visually related but distinguishable.

The Plans heading has a 46px circular add button with a centred 21px plus icon. Filters are rounded pills, minimum height 44px, horizontally scrollable when needed. Selected filter is navy with white text. Plan rows use a compact calendar badge, wrapping title, metadata and a 44px detail action.

### Memories

Memory cards are stacked with 18px gaps. They use a media area above a padded title/body area. Keep photos and videos prominent; avoid stretching source media. Media controls and empty/failure states must remain usable when files are unavailable. The investor demo photograph is illustrative and is distinct from user uploads.

### Special dates

Use separate spacious birthday/anniversary cards, rather than a dense list of inline actions.

- Top row: 16px occasion icon, uppercase 10px type label and optional demo badge.
- Title: 28px serif, with 18px vertical margins.
- Date row: 20px gap; margin `24px 0 28px`.
- Calendar badge: 54px wide × 68px high, padding `10px 0 6px`, 25px day number. Month label has no extra top margin.
- Countdown: 13px, weight 500; reminder line 11px with 9px separation.
- Suggestion: 13px / 1.75, with 24px below.
- Primary “Plan something” button spans the card, minimum height 48px, with a right-hand arrow.
- “Manage date” is a quiet centred secondary action, minimum height 44px. Edit/calendar/removal actions live in the management flow.

## 6. Landing page and account flow

The landing page introduces Together before showing authentication choices. The sequence is wordmark → short hero statement → three benefits → shared-space explanation → sign-up/sign-in controls → discreet admin link.

- Landing content has 26px horizontal account-screen padding.
- Hero heading: 42px / 1.12; summary: 14px / 1.75, maximum width 355px.
- Benefit rows: 20px gaps; 36px icon discs with warm, sage and blue-grey fills.
- Benefit title: 13px weight 600; explanation: 11px / 1.6.
- Authentication block has a top divider and 26px top padding; its heading is 29px serif.
- Provider buttons: minimum height 53px, radius 14px, 14px text. Google is light, Apple navy, email coral.
- The “or” separator is a fine horizontal rule interrupted by small muted text.
- Admin sign-in is an 11px muted footer link, with 30px top margin and 8px 12px click padding. It becomes underlined on hover and gets a visible focus ring.

Email forms use the same field system, visible validation and accessible password visibility controls. Loading states disable the relevant submit action. Current authentication remains a prototype; visual styling does not imply production identity verification.

## 7. Customer dialogs and feedback

Customer dialogs are full-height sheets capped at the app width. On wider screens they become centred 460px dialogs with 18px corners, height `calc(100dvh - 40px)` and maximum height 900px. Confirmation dialogs are shorter bottom sheets with 23px top corners.

Headers contain a wrapping serif title and round close control. Form submission actions remain reachable at the bottom; the plan form uses a sticky action region. Toasts appear above bottom navigation, use a navy surface and white 12px text, and disappear after 4.2 seconds.

## 8. Admin desktop layout

### Workspace

- Full-width cream canvas, separate from the 480px customer shell.
- Fixed sidebar: 232px wide on normal desktop; 200px at widths up to 1150px.
- Persistent navigation: Together logo, section links and a quiet lower area with app link/read-only context.
- Navigation links: minimum height 48px, 12px corners, 20px line icons and 13px labels.
- Active link: navy fill and white text. Hover uses a light warm fill.
- Sticky workspace header: minimum height 90px; padding 16px 32px; contains breadcrumb, global search, activity preset and refresh.
- Main area: 232px left offset, 36px 32px padding, maximum width 1700px. At the smaller desktop breakpoint this becomes 200px offset and 28px 24px padding.
- Charts use two equal columns with 24px gaps; trend charts span both columns.

### Summary metrics

Overview and engagement use the same compact six-column grid with 10px gaps. Card padding is 16px 14px, corners 14px, label 11px, value 30px, help 10px / 1.4. Navy identifies the lead card; warm peach identifies missed plans. At ≤1100px use three columns; at ≤600px use two.

### Search and tables

Accounts and Couple spaces each have one compact toolbar: heading, search field, Search button, Previous, page indicator and Next. Search is independent per table and queries records beyond the visible page.

- Toolbar gap: 20px; bottom margin: 16px.
- Search area: maximum flex basis 420px, gap 8px.
- Search input: minimum height 38px; padding 9px 12px.
- Toolbar buttons: minimum height 38px; padding 8px 12px.
- Pagination gap: 8px; page indicator: 12px.
- Table header vertical padding: 12px; headings remain sticky within the table scroll area.
- Accounts, Couple spaces and Activity breakdown panels are capped at 800px total height. The table body area scrolls internally while the panel controls remain accessible.
- Tables retain horizontal overflow when necessary. Do not crush identifiers or metrics into unreadable columns.
- Account/couple names are underlined buttons opening protected read-only details.

At ≤1150px table toolbars may wrap with 12px gaps. At ≤600px search moves to a full-width row.

### Chart presentation

Trend charts use SVG with a `900 × 300` viewBox and responsive width. The plotting region runs from x=76 to 866 and y=48 to 238, leaving room for labels.

- Navy/muted axis labels, fine neutral gridlines and a 3px coral trend line.
- Five count ticks including zero. Scale rounds upward to integer steps.
- Up to six date ticks, formatted as day + short month.
- Daily point markers: radius 5px, coral fill and 2px white stroke.
- Hover/focus marker: radius 7px, navy fill and coral outline.
- Hover, click or keyboard focus updates the exact date/count readout beneath the chart.
- The expandable daily-value table provides exact values without relying on the visual line.
- Activity dates are labelled UTC. Completion dates are saved calendar dates.

Activity and Memories made each have From/To date controls, Apply and Reset. Memory filtering is independent; activity filtering also updates related usage/upload reporting. Controls are limited to available 30-day reporting history. Snapshot totals remain current, not historical. Custom-period distinct active accounts are currently unavailable and shown as a dash with explanatory text.

The top preset dropdown is at least 48px high, with padding `13px 44px 13px 18px`. Its custom chevron sits 18px from the right edge, uses 1.5px navy borders and does not intercept clicks.

### Record details

Use a native dialog capped at `min(1120px,94vw)` and 90vh, with internal scrolling. It has a sticky header, cream background, 24px corners and a blurred navy translucent backdrop. Show account/couple identity, member links, summary cards, scoped activity chart, saved plans/memory text, special dates and rhythm settings. Account activity covers that person; couple activity combines members. Device-only files are explicitly unavailable.

## 9. Motion and transitions

Animations are implemented using JavaScript’s Web Animations API and CSS, not Java. They are short, decorative and must not block use of the interface.

Primary easing:

```css
cubic-bezier(.22, 1, .36, 1)
```

| Interaction | Duration | Movement / treatment |
| --- | --- | --- |
| Customer content entrance | 440ms | Opacity 0→1; translate upward from 14px; stagger 45ms, capped at six increments |
| Customer button/tab press | 200ms | Scale to 0.96 |
| Customer button hover | 200ms | Lift 2px and add soft shadow, hover-capable devices only |
| Customer input focus | 200ms | Border/shadow transition; soft coral halo |
| Customer dialog opening | 320ms | Opacity 0→1, 24px upward entry, scale 0.985→1 |
| Toast entrance | 220ms ease-out | Opacity and 8px upward movement |
| Admin card/chart entrance | 420ms | Opacity and 14px upward movement; 30ms stagger across six positions |
| Admin bars | 650ms | Horizontal growth from scaleX(0), left origin |
| Admin menu/control states | 200ms ease | Colour, border, shadow and transform |
| Admin menu hover | 200ms | Shift 3px right |
| Admin light-button hover | 200ms | Lift 1px and add subtle shadow |
| Admin button press | Brief state | Move 1px down |
| Admin record opening | 280ms | Opacity, 16px upward entry, scale 0.985→1 |
| Admin dialog backdrop | 200ms ease | Fade in |
| Admin chart-point interaction | 150ms ease | Marker radius and fill change |

Admin entrances use IntersectionObserver at a 5% visibility threshold and animate each DOM element once. Newly rendered metric cards can animate again because they are new elements. Content is not permanently hidden while waiting for JavaScript animation.

Customer section navigation scrolls to the top smoothly when motion is allowed. Admin uses CSS smooth scrolling for normal in-page links; explicit search positioning uses an immediate scroll. Do not add looping decoration, parallax or delays before controls become usable.

### Reduced motion

Respect `prefers-reduced-motion: reduce`. Customer CSS disables animations/transitions and its JavaScript skips motion. Admin CSS places animations/transitions inside the no-preference condition; its JavaScript skips entrances and finishes running animations when the preference changes. Scrolling becomes immediate.

## 10. Responsive behaviour

| Context | Behaviour |
| --- | --- |
| Customer ≤350px | Gutters shrink to 16px; headings and some card text reduce; form gap 9px |
| Customer ≥600px | Centred narrow shell retains mobile layout; dialogs become inset floating panels |
| Account viewport height ≤740px | Illustration and heading spacing reduce |
| Admin ≤1150px | Sidebar 200px; tighter workspace padding; table controls may wrap |
| Admin ≤1100px | Compact summary metrics become three columns |
| Admin ≤800px | Sidebar becomes horizontal navigation; header wraps; main left offset removed |
| Admin ≤600px | Compact metrics become two columns; table search gets its own row |

The admin’s small-screen layout is a fallback. Desktop density, clear navigation and usable wide tables take priority.

## 11. Icons, imagery and accessibility

Use the existing inline SVG icon language: unfilled strokes, rounded line caps/joins, normally 1.6px stroke. Typical sizes are 22px general, 21px customer navigation, 20px admin navigation, 17px button and 16px card icons. Avoid introducing a competing icon style.

Keep descriptive text alongside unfamiliar icons. Main customer icon controls are at least 44px. Keyboard focus must remain visible: customer controls use a 3px coral outline offset 3px, and fields use a peach outline. Preserve native dialog keyboard behaviour, labelled inputs, live status messages and selected navigation state. Chart points are keyboard reachable, with a text readout and exact-value table.

The prototype includes small metadata and dense admin controls; these require a dedicated accessibility review before public launch. Do not describe the current design as fully audited.

## 12. Maintaining this specification

Source of truth:

- `app/ui.html`: customer markup, CSS and interaction/motion logic.
- `app/admin/ui.html`: admin markup and CSS.
- `public/admin.js`: admin charts, data rendering, dialogs and JavaScript animation.
- `public/memory-media.js`: browser media handling.
- `scripts/generate-ui.py`: regenerates route-ready `app/ui.ts` and `app/admin/ui.ts`.

Edit the HTML source files, then regenerate the TypeScript artifacts. Do not independently edit generated UI strings. Styles contain layered overrides from iteration: later declarations and media queries take precedence. This document records the intended current effective styles, not every superseded rule.

When adding a component, reuse the palette, serif/sans hierarchy, existing button and field language, contextual spacing and reduced-motion rules. Verify it at a narrow customer width and a wide admin width as appropriate. Update this specification when a shared design decision changes.
