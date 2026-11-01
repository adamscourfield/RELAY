# Simply Homework — reusable product design system

Version 1.0 · 31 October 2026

A standalone implementation guide for applying this visual language to other products. Adapt the product name, domain, content and navigation. Preserve the visual hierarchy, spacing, component behaviour and calm tone.

This document describes the current teacher studio, rather than the older practice-library design. It also provides a consolidated starter stylesheet so a new project does not need to inherit the original application's CSS overrides.

## Contents

1. Design direction
2. Foundations and tokens
3. Typography
4. Spacing, shape and elevation
5. Application shell
6. Responsive layout
7. Navigation and page structure
8. Buttons and interactive cards
9. Forms and dropdowns
10. Guided workflows
11. Cards, notices and status
12. Inline editing
13. Visuals and media
14. Student and focused-task views
15. Dialogs and confirmations
16. Motion and feedback
17. Accessibility
18. Writing and content
19. Portable implementation starter
20. Component anatomy
21. Applying the system to another product
22. Acceptance checklist
23. Source references
24. Reusable implementation brief

## 1. Design direction

### Character

Calm, thoughtful, approachable and quietly professional. The interface should feel like an organised workspace with a touch of printed stationery: warm white surfaces, pale sage panels, fine borders, forest-green actions and generous whitespace.

The design supports focused work. Decorative details should help establish a welcoming tone without competing with the task.

### Principles

- Give every page a clear title, purpose and primary action.
- Group related information in bordered panels.
- Use space and typography to establish hierarchy before adding colour.
- Keep changes close to the content they affect.
- Reveal optional detail progressively.
- Make state visible: selected, saved, incomplete, ready, assigned or failed.
- Keep content and actions understandable without technical knowledge.
- Preserve user work when navigating, saving or handling errors.
- Use the same interaction pattern wherever the same action appears.

### Recognisable ingredients

| Ingredient | Treatment |
| --- | --- |
| Background | Warm off-white, almost paper-like |
| Main surfaces | White with a fine sage-grey border |
| Primary actions | Solid forest green with white text |
| Supporting panels | Very pale sage or warm cream |
| Typography | DM Sans for interface copy; Manrope for headings |
| Editorial accent | Occasional Georgia italic in a welcome or hero message |
| Icons | Simple outline icons, generally Lucide |
| Shape | Modest rounded corners, usually 6–12px |
| Depth | Borders first; subtle shadows on floating or elevated elements |
| Decoration | Restrained leaves, sparkles, books or paper motifs |

### Avoid

Neon colours, glossy gradients, large coloured shadows, excessive pill shapes, dense tables without breathing room, unexplained icon-only actions, generic AI sparkles on every control, and technical editing surfaces for ordinary users.

Do not reproduce the brand name, book logo or education-specific wording in an unrelated product unless intentionally retaining that identity.

## 2. Foundations and tokens

These consolidate the colours used by the current app into reusable roles. The source contains additional close variations; new projects should use semantic tokens instead of creating more near-duplicates.

### Core palette

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#FAFBF7` | Application background |
| `--surface` | `#FFFFFF` | Cards, sidebar, top bar |
| `--surface-input` | `#FCFDF9` | Editable fields |
| `--surface-soft` | `#F3F7EE` | Nested optional editors and quiet hover surfaces |
| `--surface-sage` | `#EDF2E5` | Welcome hero and supporting feature panels |
| `--surface-cream` | `#F6F6ED` | Sidebar editorial note |
| `--surface-warm` | `#F5F2E8` | Test-mode or informational environment banner |
| `--brand` | `#285848` | Primary action and strong brand accent |
| `--brand-hover` | `#1D4537` | Primary action hover |
| `--ink` | `#283C32` | Main interface text |
| `--heading` | `#2E4839` | Page and panel headings |
| `--text` | `#536A46` | Form values and normal green-toned copy |
| `--text-secondary` | `#727E66` | Supporting explanations |
| `--text-muted` | `#78866B` | Metadata; verify contrast for its actual background |
| `--text-quiet` | `#9CA78E` | Placeholder or decorative quiet text; not essential instructions |
| `--line` | `#DFE7D4` | Panel borders |
| `--line-input` | `#DFE6D4` | Input borders |
| `--line-subtle` | `#EEF0E7` | Internal dividers |
| `--selected-bg` | `#EAF1E8` | Active navigation |
| `--selected-line` | `#B4C99F` | Selected choice borders |
| `--focus` | `#285D4C` | High-visibility focus outline |
| `--danger` | `#9B5147` | Delete actions and destructive intent |
| `--danger-bg` | `#FFF1ED` | Destructive hover or notice background |
| `--warning-text` | `#8C7E57` | Warm informational banner text |

Colour names express roles. If the project later adds dark mode, remap roles rather than inverting individual components. The current app is a light theme; no dark theme is specified here.

### Supporting accents

Use sparingly for category icons, never as the only way to communicate meaning.

- Peach: `#F7EADB` background, `#B0966F` foreground.
- Lavender: `#EEE7F7` background, `#9983B3` foreground.
- Sage: `#F0F5E9` background, `#8AA275` foreground.
- Sand: `#F8F1E6` background, `#A68564` foreground.

### Colour accessibility

The existing prototype includes very small and pale metadata. Treat those values as visual references, not proof of accessibility. For a new project, check every foreground/background pair, darken essential muted text where needed, and prefer the readable scale below. Do not apply disabled opacity to meaningful static text.

## 3. Typography

### Families

```css
--font-body: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-heading: "Manrope", "DM Sans", system-ui, sans-serif;
--font-editorial: Georgia, "Times New Roman", serif;
```

The app loads DM Sans and Manrope through Google Fonts. Other projects can self-host the fonts or use system fallbacks. Typography should remain functional when fonts fail to load.

### Roles

The current desktop studio uses a compact scale: approximately 29px for page titles, 17px for panel titles, 12–15px for card headings and 10–12px for many controls. Preserve its proportions, but use the following more readable baseline for a fresh implementation.

| Role | Recommended size | Weight | Line height | Notes |
| --- | --- | --- | --- | --- |
| Hero heading | 34–40px | 700–750 | 1.2 | Maximum two or three lines |
| Page heading | 28–32px | 700–750 | 1.3 | Slightly tight tracking, about `-0.03em` |
| Section heading | 20–24px | 650–750 | 1.35 | Separates major groups |
| Panel heading | 17–20px | 650–750 | 1.4 | Clear but subordinate to page title |
| Card title | 15–18px | 600–700 | 1.5 | Allow wrapping |
| Body and controls | 14–16px | 400–500 | 1.6–1.8 | Default for new projects |
| Field label | 12–14px | 500–600 | 1.5 | Never rely on placeholder alone |
| Metadata/helper text | 12–13px | 400–500 | 1.6 | Dark enough to read |
| Eyebrow | 10–11px | 650–700 | 1.5 | Uppercase, `0.12–0.18em` tracking |
| Reading material | 16–18px | 400 | 1.8–1.95 | Comfortable long-form reading |

Use `rem` for text sizes in new projects. Do not shrink text to make layouts fit. Avoid all caps for paragraph copy or editable field values.

### Editorial accent

Use Georgia italic for a short phrase inside a welcome message. Keep interface labels, form fields and task content in the sans-serif system. The editorial accent should feel intentional, not become a third competing interface font.

## 4. Spacing, shape and elevation

### Spacing scale

Use a 4px-based scale, with a few established app dimensions retained for visual fidelity.

| Size | Typical use |
| --- | --- |
| 4px | Tiny icon adjustments or badge separation |
| 8px | Icon-to-label gap; short field-group gaps |
| 10–12px | Label-to-control gap; chip padding; compact actions |
| 16px | Inner card detail spacing |
| 18–20px | Mobile panel padding; secondary group gaps |
| 22–24px | Desktop card padding; inline visual padding; column gaps |
| 26–32px | Section separation and larger panel padding |
| 34–42px | Main desktop content padding |
| 48px+ | Major page divisions where needed |

### Rules

- Keep at least 10px between an inline visual label and its control.
- Leave approximately 22px below the inline visual heading before the fields.
- Use a 24px gap between visual type and visual description columns.
- Use 22px padding inside an expanded visual panel; 18px on narrow screens.
- Align the top edges of related fields. Do not use baseline alignment for a select beside a multiline textarea.
- Separate nested editors from surrounding content with both space and a subtle boundary.
- Use flex/grid `gap` for relationships instead of scattered child margins.

### Radius and borders

- Small badge: 4px.
- Button/input: 6px.
- Nested editor: 7–8px.
- Card/panel: 9–10px.
- Hero/dialog: 12px.
- Step indicator/avatar: circular.
- Default border: 1px solid `--line`.

### Elevation

Most surfaces remain flat. Suggested tokens:

```css
--shadow-card: 0 5px 15px rgb(102 128 76 / 4%);
--shadow-popover: 0 12px 36px rgb(35 55 47 / 12%);
--shadow-dialog: 0 25px 80px rgb(22 38 14 / 23%);
```

A tilted paper illustration may use an offset flat shadow plus a softer cast shadow. Do not use that decorative depth on normal form panels.

## 5. Application shell

### Desktop structure

```text
┌──────────────────┬──────────────────────────────────────────┐
│ Brand            │ Breadcrumb                  Account/view │
│ Workspace        ├──────────────────────────────────────────┤
│                  │ Optional environment/status banner       │
│ Navigation       ├──────────────────────────────────────────┤
│                  │ Page heading and main action             │
│                  │                                          │
│ Editorial note   │ Main work area          Supporting aside │
│                  │                                          │
│ Account footer   │ Footer                                   │
└──────────────────┴──────────────────────────────────────────┘
```

### Current app measurements

- Sidebar: fixed, 246px wide at full desktop.
- Sidebar padding: approximately 32px top and 18px horizontally.
- Top bar: 76px high, white, bottom border.
- Main wrapper: offset by the sidebar width.
- Main content: `max-width: 1460px`, centred within the wrapper.
- Main padding: `34px 42px 22px`.
- Builder layout: flexible main column plus a 250px aside, 23px gap.
- Sidebar stacking level: 20.
- Dialog stacking level: 60.

### Sidebar hierarchy

1. Product identity.
2. Workspace or context card.
3. Quiet uppercase navigation-group label.
4. Primary navigation.
5. Optional editorial/support note.
6. Account summary anchored near the bottom.

Active navigation uses a pale sage background, dark green text and icon, and stronger weight. Keep icon and label aligned. A navigation row should have a generous click target across its entire width.

### Top bar

Use a small breadcrumb on the left and a compact account/context switch on the right. Avoid repeating all page actions here. A teacher/student switch is specific to this prototype; replace it with the actual contexts of the new product, or omit it.

## 6. Responsive layout

The source studio uses breakpoints at 1500, 1200, 1000, 760 and 600px, with additional 650px rules for nested editors. A new implementation can consolidate these while preserving the behaviour.

| Viewport | Current behaviour / adaptation |
| --- | --- |
| Above 1500px | Slightly larger hero type and more room for illustration |
| 1001–1200px | Sidebar around 215px; aside around 210px; card grids reduce to two columns |
| At/below 1000px | Builder and student reading layouts become one column; supporting content moves below |
| 601–760px | Sidebar around 190px; reduced horizontal padding; compact stepper hides subtitles |
| At/below 650px | Inline visual fields stack vertically |
| At/below 600px | Sidebar becomes a top navigation region; content uses full width; optional sidebar notes disappear; task cards stack |

### Required responsive behaviours

- Keep all essential actions available on small screens.
- Do not let the fixed sidebar reduce the work area to an unusable width.
- Stack related form fields when two columns no longer fit comfortably.
- Use `minmax(0, 1fr)` and `min-width: 0` to prevent overflow.
- Allow long titles, translated labels and status text to wrap.
- Keep dropdown option text and chevrons separated.
- Scale media to container width with preserved proportions.
- Let action groups wrap; do not overlap or truncate the primary action.
- Use horizontal tab scrolling only when it is discoverable and keyboard accessible.
- Hide optional decoration before hiding meaningful information.

## 7. Navigation and page structure

### Page header

Use this order:

1. Small optional eyebrow.
2. One `h1` naming the page.
3. One concise supporting sentence.
4. Main action aligned right on desktop, below on narrow screens.

### Scroll behaviour

When changing pages or wizard steps, open the next view at the top. Do not inherit the previous page's bottom scroll position. Do not reset scroll while a user types or makes a small inline edit.

In-page actions such as expanding a visual editor should keep the user near that chunk. Opening a modal should preserve the underlying page position.

### Interactive summary cards

A summary that promises access to its underlying items should be a real link or button, not an inert statistic. In Simply Homework, the “Homework tasks” statistic opens My homework and clears the previous search.

Use hover and focus states that make this behaviour visible. Do not make decorative statistics appear clickable.

## 8. Buttons and interactive cards

### Primary button

- Forest-green fill and matching border.
- White text and optional outline icon.
- Radius 6px.
- Comfortable horizontal padding, approximately 16px.
- Prefer 40–44px minimum height in new projects.
- Hover darkens to `--brand-hover`.
- Use a visible focus ring.

One dominant action per local decision point is usually enough.

### Secondary button

White fill, sage border, green text. Use for preview, back, duplicate and other supporting actions. Match the primary button's height.

### Text button

Use for lightweight local actions such as Add visual, Remove request or returning to a parent view. Keep focus visible and enlarge the hit area even when the text is small.

### Icon button

Use for compact repeated actions such as duplicate and delete. Every icon-only button needs an accessible name and a visible tooltip or equally clear context. Delete uses the muted brick-red danger colour.

### States

| State | Behaviour |
| --- | --- |
| Default | Clear label and appropriate emphasis |
| Hover | Small background/border change; no layout shift |
| Focus | Visible high-contrast outline with offset |
| Pressed/selected | Persistent state distinct from hover |
| Loading | Progress label and optional spinner; prevent duplicate submission |
| Disabled | Visually subdued; explain the prerequisite nearby |
| Success | Confirm the completed action and retain useful context |
| Failure | Explain the issue and let the user retry without losing work |

### Cards

Cards use white surfaces, 1px borders and 10px radii. A typical task card contains a small icon/status row, category metadata, title, supporting details and bottom actions.

Use a button or anchor for a whole-card action. If the card has multiple separate actions, use an `article` with explicit buttons; do not nest buttons inside a whole-card button.

## 9. Forms and dropdowns

### Field anatomy

```text
Field label                 Optional
One short helper sentence if useful.
┌───────────────────────────────────┐
│ Current value                 ⌄   │
└───────────────────────────────────┘
Validation or helper text
```

- Keep labels visible at all times.
- Put format instructions before the user needs them.
- Give optional fields a consistent marker.
- Use appropriate native inputs where possible.
- Make errors specific and associate them with the field.
- Preserve values after a validation error.

### Field treatment

- Warm-white input surface.
- 1px sage border.
- Radius 6px.
- Padding approximately 11px vertically and 12px horizontally.
- Text in `--text`.
- Textarea line height about 1.8.
- Textareas can resize vertically.
- Do not use placeholder text as the only explanation.

### Dropdown chevrons

Custom chevrons are inset 14px from the right edge. Reserve at least 42px of right padding so option text cannot collide with the arrow. A 14px outline chevron fits the current design.

Use a native select with `appearance: none` for styling. In forced-colours mode, restore native appearance or otherwise ensure the arrow remains visible. Keep native keyboard behaviour.

### Form grid

Two equal columns on a roomy desktop form, with topic/title and longer text areas spanning both columns. Use 18–24px column gaps and 20–24px row gaps. Nested visual forms use a narrower type column and wider description column; stack them on small screens.

### Radio choice groups

Prior-learning answers use labelled radio controls inside lightly bordered tiles. The selected tile gains a sage fill, stronger border and visible checked input. Use a `fieldset` and `legend` for each group. The full label is clickable.

## 10. Guided workflows

### Three-step model

The current sequence is:

1. Class details.
2. Prior learning.
3. Review the editable draft.

In another product, replace these with domain-relevant steps while retaining the same structure.

### Stepper design

- White panel with a fine border and 9–10px radius.
- Equal-width columns.
- Numbered circle, title and short subtitle.
- Current step: dark green circle with white number.
- Completed step: pale green circle with a check.
- Future step: neutral circle and quieter title.
- Subtle dividers between steps on wide screens.
- Hide subtitles before shrinking the step titles excessively.

Use an ordered list and expose the current item with `aria-current="step"`. A visual step indicator should not pretend to be clickable unless direct step navigation is implemented safely.

### Progression rules

- Validate the current step before continuing.
- Do not silently invent answers for the user.
- Generate or prepare the draft only after the prerequisite information is supplied.
- Offer a clear back action and preserve entered values.
- Start the next step at the top.
- Warn before an action rebuilds a draft and replaces manual edits or visuals.
- Distinguish returning to an existing draft from rebuilding it.
- Existing assigned/published versions remain stable; duplicate to edit when required by the product.

## 11. Cards, notices and status

### Supporting aside

Use a 210–250px secondary column for short guidance, examples or sequencing context. It should support the main task. Move it below the form at narrower widths; omit optional decorative notes on mobile.

### Context summary

At the top of draft review, show a pale-sage panel containing the item title and a wrapping row of small metadata chips. Keep chips informational, not button-like, unless they really open editing controls.

### Status labels

Use a short word such as Draft, Assigned, Saved or Test. Pair text with colour. Do not communicate state using a coloured dot alone.

### Notifications

Success and information notices sit near the top of the work area and use a gentle tinted background, short text and a dismiss control. Errors use a clear message beside the action or field that caused them. Important notices must not disappear before they can be read.

### Empty states

Explain what is missing, provide one useful next action and optionally a short example. Avoid making the user read a long explanation before starting.

## 12. Inline editing

### Main principle

Edit content where it lives. Do not expose JSON, HTML or source-code dialogs to ordinary users.

### Explanation chunk

Each chunk is its own white bordered card with:

- A small section label.
- Editable heading.
- Editable body text.
- Optional worked-example field.
- Local Add visual control at the bottom.

The heading may look like a heading while remaining an editable input. Keep its label and focus treatment clear.

### Question chunk

Each question contains:

1. Number and question type.
2. Editable wording.
3. Editable answer controls appropriate to the type.
4. Feedback/explanation shown after submission.
5. Its own local visual editor.

Answer editing patterns:

- Multiple choice: text fields with separate “Correct” checkboxes; support more than one correct answer when allowed.
- Short answer: visible accepted-answer fields, with an action to add another accepted form.
- Matching: paired fields labelled “Match item” and “Matches with”.
- Ordering: items shown with their intended position; provide accessible reorder controls if users can change the sequence.

Changing content should clear any previous approval state. Validate marking keys before saving or assigning. Do not discard edits when switching review tabs.

### Review tabs

Teaching material, Questions and Answer keys use a quiet tab strip with an icon, label and bottom border. The selected tab has darker text and a sage underline. Implement proper tab semantics and keyboard navigation in a reusable component.

### Final review panel

Use a pale-sage approval panel after the content. Explain the review responsibility, include an explicit approval control if needed, and group Save, Preview and Assign/Publish actions. The primary action remains unavailable until its prerequisites are met.

## 13. Visuals and media

### Scope

A visual belongs to one specific explanation chunk or question. Each chunk owns its own request and selected visual. Adding a visual to one question must not replace another question's visual.

### Expanded visual editor

```text
┌────────────────────────────────────────────────────────┐
│ ✧ Visual for this explanation            Remove request │
│                                                        │
│ Visual type             What should it show?            │
│ ┌───────────────────┐   ┌────────────────────────────┐  │
│ │ Diagram         ⌄ │   │ Description…               │  │
│ └───────────────────┘   └────────────────────────────┘  │
│                                                        │
│ Prepared test visual (prototype only)                   │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Named example                                   ⌄ │  │
│ └───────────────────────────────────────────────────┘  │
│                                                        │
│ [ Create visual ]                                      │
│ Honest mode/status explanation                         │
│                                                        │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Visual preview                                    │  │
│ └───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Styling

- Pale sage surface `#F3F7EE`.
- Fine sage border and 7–8px radius.
- Desktop padding 22px, mobile padding 18px.
- Heading-to-fields gap 22px.
- Label-to-control gap 10px.
- Field-column gap 24px.
- Description field receives more width than type.
- Actions are separated from fields by 18px or more.
- Preview uses a white inset surface with its own border and caption.

### Behaviour

- Add visual expands controls in the same chunk.
- Create visual produces or inserts a preview in that chunk.
- Replace visual changes only that chunk's media.
- Remove visual removes the preview but can retain the request.
- Remove request removes the local request and its preview.
- Saving the parent draft persists all independent media choices.
- Student views render media, not the teacher's request controls.

### Prototype versus live generation

The current app uses prepared examples without a runtime AI API. It labels the examples, names the selected asset and explains that the description is saved for future generation. This is prototype behaviour, not a general design-system requirement.

If another product uses live generation, replace the example selector with real generation behaviour and show genuine pending, failure and completion states. Never simulate generation while silently selecting unrelated stock content.

### Rendering and accessibility

- Images have descriptive alt text.
- Photorealistic AI illustrations are labelled appropriately; do not imply they are documentary evidence.
- Diagrams have meaningful labels, readable type and a text description.
- SVGs use a title/accessibility label.
- Animations offer play/pause and a useful static state.
- Respect reduced-motion preferences.
- Avoid autoplay that distracts from reading.
- Preserve aspect ratio and prevent layout overflow.
- Sanitize untrusted markup; prefer known assets or structured rendering over arbitrary inserted HTML.

## 14. Student and focused-task views

For a learner, customer or other recipient, remove authoring controls and present only the necessary content.

### Reading view

Use a spacious main reading column with goals, numbered sections, clear headings, body copy, worked examples and associated visuals. A supporting card can contain the next action, estimated duration and item count.

Use a longer line height and larger body text than the authoring metadata. For long reading passages, target approximately 60–75 characters per line.

### Focused task/quiz

The current app uses a centred dialog-like surface with a title, close/save action, progress, one question at a time, answer controls and next/back navigation.

Preserve these interaction rules where relevant:

- Save progress and allow resuming.
- Make answered and current items visually distinct.
- Keep answers editable until final submission.
- Show scores and marking explanations after submission, not while answering.
- Make retry behaviour explicit.
- Avoid exposing answer keys in recipient payloads.

These assessment rules are domain-specific. Transfer the focused layout and clear progression to other products without automatically transferring the scoring model.

## 15. Dialogs and confirmations

Use a dialog for a bounded decision, confirmation or genuinely separate subtask. Keep normal editing inline.

### Visual treatment

- Dark green translucent backdrop, approximately `#2C402AC4`.
- Optional 5px backdrop blur.
- Warm-white dialog surface.
- Radius 12px, subtle border, strong but soft shadow.
- Width constrained to content; large existing prototype dialogs use a maximum of about 850px.
- Padding about 24–30px desktop and 18–22px mobile.

### Interaction

- Give the dialog an accessible name.
- Move focus inside when opened.
- Trap focus while modal.
- Prevent interaction with the background.
- Support Escape where safe.
- Restore focus to the triggering control on close.
- Preserve entered values on recoverable failure.
- Use a small confirmation for destructive actions, with explicit action wording.

Do not reintroduce a full-draft code editor as a shortcut for designing ordinary content controls.

## 16. Motion and feedback

Use short transitions, generally 150–200ms, for background, border and opacity changes. Avoid moving content just to make the interface feel active.

- Hover should not cause layout shift.
- Loading spinners represent real outstanding work.
- Keep button widths stable when possible during loading.
- New pages and wizard steps scroll to the top without an unnecessary animated journey.
- Optional in-page reveals may use restrained motion.
- Decorative illustrations can be tilted statically.
- Educational animation is content and needs explicit controls.
- Under `prefers-reduced-motion: reduce`, remove unnecessary animation and retain all information.

## 17. Accessibility

The visual system must be implemented with semantic controls and tested; styling alone does not establish conformance.

### Required checks

- One clear `h1` per page and logical heading order.
- Visible labels for every form control.
- Full keyboard operation.
- Visible focus states on all interactive elements.
- No keyboard traps except deliberate modal focus containment.
- Informative alt text and captions where needed.
- State conveyed by text or icons in addition to colour.
- Sufficient contrast for normal text, large text and control boundaries.
- Comfortable pointer/touch targets, aiming for 44px where practical.
- Content remains usable at 200% zoom and with enlarged text.
- No essential horizontal scrolling at narrow viewport widths.
- Errors linked to inputs using `aria-describedby` and `aria-invalid`.
- Save/status updates announced politely without repeated interruption.
- Reduced-motion and forced-colours support.
- Recipient views cannot edit authoring fields.

Use native button, input, select, fieldset and label elements wherever possible. Custom widgets must provide the behaviour users expect from their native equivalents.

## 18. Writing and content

### Voice

Friendly, clear, calm and competent. Use short sentences and concrete verbs. Be reassuring without being childish. Use UK English for projects retaining this product's language.

### Action labels

Prefer “Create draft”, “Save draft”, “Add visual”, “Replace visual”, “Preview” and “Delete draft”. Use a verb that describes the actual result.

Avoid vague labels such as “Process”, technical labels such as “Serialize content”, and promises the software cannot fulfil.

### Helper text

Explain what the user needs to decide. For example:

- “Describe the image, labels or movement.”
- “Rebuilding replaces your current edits and visuals.”
- “Choose what the group has already covered.”

### Status text

- Success: “Draft saved.”
- Progress: “Creating draft…”
- Error: “We couldn’t save your changes. Try again.”
- Empty state: “No drafts yet. Create your first task.”

Use product-specific language for domain concepts. Do not retain homework metaphors in a finance, health or operations product simply because they appear in this reference.

## 19. Portable implementation starter

The following is a consolidated starting point, not a verbatim export of the accumulated app styles. It uses a more readable text scale and component-scoped selectors. No framework is required.

Load Manrope and DM Sans separately if available, or use the included fallbacks.

```css
:root {
  --canvas: #fafbf7;
  --surface: #fff;
  --surface-input: #fcfdf9;
  --surface-soft: #f3f7ee;
  --surface-sage: #edf2e5;
  --brand: #285848;
  --brand-hover: #1d4537;
  --ink: #283c32;
  --heading: #2e4839;
  --text: #536a46;
  --text-secondary: #66745b;
  --line: #dfe7d4;
  --line-input: #dfe6d4;
  --focus: #285d4c;
  --danger: #9b5147;
  --font-body: "DM Sans", system-ui, sans-serif;
  --font-heading: "Manrope", system-ui, sans-serif;
  --sidebar-width: 246px;
  --radius-control: 6px;
  --radius-panel: 10px;
}

*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--canvas);
  color: var(--ink);
  font: 1rem/1.65 var(--font-body);
}
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }
h1, h2, h3 { font-family: var(--font-heading); color: var(--heading); }
h1 { font-size: clamp(1.75rem, 2.4vw, 2rem); line-height: 1.3; letter-spacing: -.03em; }
h2 { font-size: 1.25rem; line-height: 1.4; }
p { line-height: 1.7; }
:where(button, a, input, select, textarea):focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}

.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-width);
  padding: 32px 18px 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--line);
  z-index: 20;
}
.app-main { margin-left: var(--sidebar-width); min-width: 0; }
.app-topbar {
  min-height: 76px;
  padding: 16px 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.page { max-width: 1460px; padding: 34px 42px 24px; margin: auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.eyebrow { font-size: .6875rem; text-transform: uppercase; letter-spacing: .15em; font-weight: 700; color: var(--text-secondary); }
.nav-link { display: flex; align-items: center; gap: 12px; padding: 13px; border-radius: 7px; color: var(--text-secondary); text-decoration: none; }
.nav-link[aria-current="page"] { background: #eaf1e8; color: var(--brand); font-weight: 700; }

.builder-grid { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 24px; align-items: start; }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-panel); min-width: 0; }
.panel-header { display: flex; align-items: center; gap: 14px; padding: 24px 26px; border-bottom: 1px solid #eef0e7; }
.panel-body { padding: 24px 26px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.field { display: flex; flex-direction: column; gap: 10px; min-width: 0; font-size: .875rem; font-weight: 500; color: var(--text); }
.field--full { grid-column: 1 / -1; }
.field-hint { color: var(--text-secondary); font-size: .8125rem; font-weight: 400; }
.control {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--line-input);
  border-radius: var(--radius-control);
  padding: 11px 12px;
  color: var(--text);
  background: var(--surface-input);
  line-height: 1.6;
}
textarea.control { resize: vertical; }
select.control {
  appearance: none;
  padding-right: 42px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23536a46' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 14px;
}
.control[aria-invalid="true"] { border-color: var(--danger); }
.field-error { font-size: .8125rem; color: var(--danger); }

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface);
  color: var(--text);
  font-size: .875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background .18s, border-color .18s;
}
.button--primary { background: var(--brand); border-color: var(--brand); color: #fff; }
.button--primary:hover:not(:disabled) { background: var(--brand-hover); }
.button--secondary:hover:not(:disabled) { background: var(--surface-soft); }
.button--danger { color: var(--danger); }
.action-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }

.stepper { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 20px; border: 1px solid var(--line); border-radius: 10px; background: #fff; list-style: none; gap: 16px; }
.step { display: flex; align-items: center; gap: 12px; min-width: 0; }
.step-number { display: grid; place-items: center; width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%; background: var(--surface-soft); border: 1px solid var(--line); }
.step[aria-current="step"] .step-number { background: var(--brand); border-color: var(--brand); color: white; }
.step--complete .step-number { background: #e9f2e0; color: var(--text); }
.step-title { display: block; font-size: .875rem; }
.step-subtitle { display: block; font-size: .75rem; color: var(--text-secondary); }

.chunk { padding: 22px; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 20px; background: #fff; }
.visual-editor { padding: 22px; margin-top: 24px; background: var(--surface-soft); border: 1px solid var(--line); border-radius: 8px; }
.visual-editor-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.visual-editor-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 24px; align-items: start; }
.visual-editor .action-row { margin-top: 18px; }
.visual-preview { padding: 16px; margin-top: 22px; background: white; border: 1px solid var(--line); border-radius: 9px; }
.visual-preview img, .visual-preview svg { display: block; max-width: 100%; height: auto; }
.notice { display: flex; align-items: start; gap: 12px; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: #eef5e8; color: var(--text); }

@media (max-width: 1200px) {
  :root { --sidebar-width: 215px; }
  .page { padding: 30px; }
  .app-topbar { padding-inline: 30px; }
  .builder-grid { grid-template-columns: minmax(0, 1fr) 210px; }
}
@media (max-width: 1000px) {
  .builder-grid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  :root { --sidebar-width: 190px; }
  .page { padding: 26px 22px; }
  .app-topbar { padding-inline: 22px; }
  .step-subtitle { display: none; }
}
@media (max-width: 650px) {
  .visual-editor-fields { grid-template-columns: 1fr; gap: 20px; }
  .visual-editor { padding: 18px; }
  .form-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .app-sidebar { position: static; width: auto; padding: 18px; border-right: 0; border-bottom: 1px solid var(--line); }
  .app-main { margin-left: 0; }
  .page { padding: 24px 18px; }
  .page-header { align-items: start; flex-direction: column; }
  .panel-header, .panel-body { padding: 20px 18px; }
  .stepper { padding: 14px; gap: 8px; }
  .step { align-items: start; flex-direction: column; gap: 8px; }
  .visual-editor-header { align-items: start; flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) {
  .button { transition: none; }
  .decorative-animation { animation: none !important; }
}
@media (forced-colors: active) {
  select.control { appearance: auto; background-image: none; }
}
```

## 20. Component anatomy

Example HTML using the portable classes. Wire actions and state into the framework of the new project; these buttons are structural examples.

```html
<section class="panel" aria-labelledby="content-title">
  <header class="panel-header">
    <div>
      <h2 id="content-title">Review your content</h2>
      <p>Make any changes before publishing.</p>
    </div>
  </header>

  <div class="panel-body">
    <article class="chunk" aria-labelledby="chunk-title">
      <h3 id="chunk-title">Section 1</h3>
      <label class="field" for="section-heading">
        Heading
        <input class="control" id="section-heading" value="How the process works">
      </label>
      <label class="field" for="section-body">
        Explanation
        <textarea class="control" id="section-body" rows="5"></textarea>
      </label>

      <section class="visual-editor" aria-labelledby="visual-title">
        <div class="visual-editor-header">
          <h3 id="visual-title">Visual for this explanation</h3>
          <button class="button" type="button">Remove request</button>
        </div>
        <div class="visual-editor-fields">
          <label class="field" for="visual-type">
            Visual type
            <select class="control" id="visual-type">
              <option>Diagram</option>
              <option>Moving animation</option>
              <option>Photorealistic image</option>
            </select>
          </label>
          <label class="field" for="visual-description">
            What should it show?
            <textarea class="control" id="visual-description" rows="3"></textarea>
          </label>
        </div>
        <div class="action-row">
          <button class="button button--primary" type="button">Create visual</button>
        </div>
      </section>
    </article>

    <div class="action-row">
      <button class="button button--secondary" type="button">Save draft</button>
      <button class="button button--secondary" type="button">Preview</button>
      <button class="button button--primary" type="button">Publish</button>
    </div>
  </div>
</section>
```

For production, give each repeated field a unique ID, associate helper/error messages, and implement meaningful disabled/loading/error states.

## 21. Applying the system to another product

### Keep

The palette roles, font pairing, page hierarchy, fine borders, moderate radii, generous group spacing, restrained icons, clear state and inline editing model.

### Replace

Brand assets, navigation labels, hero message, domain terminology, sample data, status vocabulary, workflow steps and any domain-specific rules.

### Implementation order

1. Define tokens and load fonts.
2. Build the responsive shell.
3. Build buttons, fields, cards, notices and tabs.
4. Build one representative page with real-length content.
5. Add the workflow and state model.
6. Implement inline editing and persistence.
7. Add optional media and preview behaviour.
8. Test keyboard access and error recovery.
9. Check mobile layouts and enlarged text.
10. Compare the result to the design principles, rather than copying every pixel of the prototype.

### Framework independence

The design works with plain HTML/CSS, React, Vue, Svelte or another UI framework. Neither the original hosting platform nor its database, AI workflow, authentication implementation or build tooling is needed to reproduce the design.

Do not copy credentials, project IDs, private task data, source-repository access settings or deployment configuration into another project. This design guide intentionally contains none of those values.

### Component boundaries

Suggested reusable components:

- `AppShell`
- `SidebarNavigation`
- `BreadcrumbBar`
- `PageHeader`
- `Button` and `IconButton`
- `Panel` and `TaskCard`
- `Field`, `SelectField`, `TextareaField`
- `ChoiceGroup`
- `Stepper`
- `ReviewTabs`
- `EditableChunk`
- `InlineVisualEditor`
- `MediaPreview`
- `Notice`
- `ApprovalPanel`
- `ConfirmationDialog`

Keep styling scoped to these components. Avoid selectors such as `.card > div span` that unintentionally restyle every nested editor or media caption.

## 22. Acceptance checklist

### Visual fidelity

- [ ] Warm off-white canvas and white main surfaces.
- [ ] Forest-green primary actions with readable white labels.
- [ ] Sage supporting panels and fine borders.
- [ ] Manrope headings and DM Sans interface copy, or deliberate fallbacks.
- [ ] Consistent 6–12px corner-radius hierarchy.
- [ ] Spacing distinguishes page sections, cards and nested fields.
- [ ] Dropdown arrows have a comfortable right inset.
- [ ] Decorative elements remain secondary to the task.

### Interaction

- [ ] Page/step navigation opens at the top.
- [ ] Local edits do not reset scroll or lose values.
- [ ] Summary cards navigate where their labels imply.
- [ ] Draft editing uses normal fields, not source-code dialogs.
- [ ] Every visual request belongs to its own chunk.
- [ ] Loading, saved, error and disabled states are meaningful.
- [ ] Rebuild and delete actions make their consequences clear.
- [ ] Preview faithfully represents recipient-facing content.
- [ ] Changes persist after reload.

### Responsive and accessible

- [ ] No clipped controls at 375, 600, 768, 1024 and 1440px widths.
- [ ] All core tasks work with keyboard only.
- [ ] Focus is visible and correctly managed in dialogs.
- [ ] Text and controls have checked contrast.
- [ ] Text remains readable at 200% zoom.
- [ ] Long labels and titles wrap without overlap.
- [ ] Media has accessible alternatives.
- [ ] Motion has controls and respects reduced-motion preferences.
- [ ] Form errors explain how to recover.
- [ ] Colour is never the only state indicator.

## 23. Source references

These paths refer to the original Simply Homework repository. They are useful when that repository is available, but are not required to use this guide.

| Source | Reference purpose |
| --- | --- |
| `app/globals.css` | Base typography, brand treatment, buttons and quiz surfaces |
| `app/studio.css` | Teacher studio shell, panels, workflow, inline editors, responsive rules and media |
| `components/homework-studio.tsx` | Page composition, navigation, prior-learning stage and inline editing |
| `components/homework-quiz.tsx` | Focused question and result interfaces |
| `components/prepared-visual.tsx` | Prepared SVG/image rendering and animation controls |
| `lib/prepared-visuals.ts` | Named prototype visual catalogue |
| `app/layout.tsx` | Global stylesheet loading |

The original CSS has accumulated responsive adjustments and later overrides. When exact fidelity is required, inspect the final cascade. For a clean new implementation, use this document's semantic tokens and scoped component structure instead of copying the entire stylesheet wholesale.

## 24. Reusable implementation brief

Copy this into a new project together with this file:

> Implement the product using the design system in `design.md`. Use a warm off-white canvas, white bordered panels, pale sage supporting surfaces, forest-green actions, Manrope headings and DM Sans interface text. Build a responsive sidebar/topbar shell and a spacious main work area. Keep forms clearly labelled, dropdown chevrons inset, and related fields separated by generous gaps. Use ordinary inline editing controls rather than JSON or HTML editors. Keep optional media controls local to the content they affect. Provide visible focus, accessible labels, meaningful state feedback, safe destructive actions and responsive layouts. Start each new page or wizard step at the top without disrupting inline edits. Adapt all branding, terminology, navigation and examples to this project's domain. Treat prototype-only behaviours as examples, not requirements. Implement the actual requested functionality and clearly label any test data or simulations.
