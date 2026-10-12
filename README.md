# Cadence

Real-time, evidence-based feedback on what teachers say, checked against what students can then do.

Cadence transcribes a lesson, scores it against a research-based rubric, classifies every question, measures wait time, pace and checks for understanding, and gives quoted evidence plus concrete next steps. Upload the exit ticket afterwards and Cadence **triangulates**: did the delivery actually land? Across many lessons, the Insights view shows which behaviours and phrases go with higher student mastery.

## Features

| Area | What it does |
| --- | --- |
| **Live** (`/live`) | Browser mic → live transcript, question classification, wait-time/pace/check-for-understanding gauges and discreet coaching nudges. On stop, the recorded audio is (when configured) re-transcribed with speaker diarization for an accurate, teacher/student-labelled final transcript. Demo mode plays a scripted lesson with no mic. |
| **Import** (`/lessons/new`) | Paste/upload a transcript (WebVTT, SRT, `[00:01:02] T: …` lines, plain text) from an external recorder, or upload the audio file itself for diarized transcription. |
| **Lesson report** | Composite score, 7-dimension rubric with quoted evidence, timeline, question log with wait times, strengths, next steps, searchable transcript. |
| **Triangulation** | Upload exit-ticket / worksheet / assessment CSV (`student, score[, max]`) → mastery, distribution, and a delivery-vs-outcome verdict. |
| **Insights** (`/insights`) | Delivery vs mastery scatter, correlation of each behaviour with mastery, and teacher phrases distinctive to high- vs low-mastery lessons. |
| **Behaviour** (`/behaviour`) | Merits/demerits/detentions/room removals are detected from the transcript itself — a teacher never clicks a button for these. Every detection is "pending" until confirmed on the lesson report (ambiguous or unheard names prompt a pick-the-student step first), so nothing reaches a student's tally unchecked. See [Behaviour detection](#behaviour-detection) below. |
| **Rubric** (`/rubric`) | The full rubric, level descriptors, weights and research sources, so every score can be checked. |

## Rubric

Seven dimensions, each scored 1–4 (Emerging → Exemplary): questioning depth, checking for understanding, explanation & modelling, retrieval & review, feedback quality, wait time, guided → independent practice. Sources include Rosenshine's Principles of Instruction, the Great Teaching Toolkit, Hattie & Timperley on feedback, Rowe on wait time, and the EEF guidance reports. See `src/lib/rubric.ts`.

## Behaviour detection

Every lesson (live, imported or demo) is scanned for merit/sanction language — `src/lib/behaviour.ts` matches phrases like "that's a merit", "demerit", "detention", "leave the room" against teacher-spoken sentences, and tries to resolve a nearby name against the class roster. Three outcomes:

- **Resolved** — the name matches exactly one student on the roster: shown pre-filled, ready to confirm.
- **Ambiguous / unrecognised** — the heard name matches several students, or none: shown with a "pick student" dropdown; choosing a name enables a separate Approve button.
- **No name heard** — the sanction/merit language was detected but no name was nearby: same dropdown, empty until picked; approval remains a separate action.

Nothing counts until a teacher explicitly approves on the lesson report or the global Behaviour queue (`BehaviourPanel`) — detection from speech is inherently fallible (misheard names, wrong-speaker attribution), so this is a human-in-the-loop review queue, not an automatic ledger. Confirmed events aggregate into a same-day per-student tally at `/behaviour`.

`src/lib/roster.ts` is a **placeholder**: it fabricates a deterministic class list from a fixed name pool since Cadence has no student data of its own. It exists to give the matching logic something real to resolve against, and is designed to be swapped for an actual roster (the intent is for Cadence to become a module inside Anaxi, which owns the real student/staff roster) without changing anything else — `getRoster`/`resolveStudent` are the only two functions that would need to change.

## Transcription

Audio (from the live recorder or an uploaded file) is transcribed via [AssemblyAI](https://www.assemblyai.com/) with speaker diarization, which is what actually separates teacher from student talk — something a plain-text transcript can only do if it's already labelled `T:`/`S:`. Set `ASSEMBLYAI_API_KEY` to enable it. Audio is sent for transcription and then discarded; Cadence never stores it. Without a key, live mode falls back to the browser's own (unlabelled, non-diarizing) speech recognition, and audio-file import is disabled.

## Analysis engines

- **Claude** (when `ANTHROPIC_API_KEY` is set): the transcript and deterministic timing metrics go to Claude, which returns structured rubric scores with verbatim evidence (`src/lib/analysis/claude.ts`). Model defaults to `claude-opus-5`; override with `CADENCE_MODEL`.
- **Pattern engine** (always available, no key needed): a transparent regex and timing engine (`src/lib/analysis/heuristic.ts`). It is fast and explainable, but crude. Treat its scores as indicative.

Timing metrics are computed deterministically. VTT/SRT cue boundaries support measured wait times. Plain text and start-only timestamps estimate speech duration at 150 wpm: pace is labelled estimated and wait time remains unknown. Unlabelled speakers are shown explicitly; talk ratio requires speaker labels.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. On first run, 12 synthetic demo lessons are seeded into `data/cadence-db.json`. Delete that file to reset.

Live transcription uses the browser's Web Speech API (Chrome/Edge). In other browsers, use demo mode or import a transcript.

## Known limitations

These are stated plainly on purpose:

- **Audio isn't the whole lesson.** Circulation, board work, body language and silent practice are invisible. Dimensions that audio captures only partially are labelled in the report.
- **Speaker separation** only happens with AssemblyAI configured (live recordings and audio-file import) or a manually labelled `T:`/`S:` text transcript. Without a key, live mode falls back to the browser's own speech recognition, which can't tell speakers apart.
- **Browser speech-to-text** (the live-coaching fallback) drops punctuation and struggles with noisy rooms; question detection falls back to interrogative openers. It also isn't private in the way it sounds — Chrome's built-in engine sends audio to Google's servers to produce it. The diarized AssemblyAI path used for the saved transcript doesn't have this problem, but you should still review whatever data processing terms your STT vendor offers before recording real students.
- **Diarization guesses teacher vs. student by talk time** (whoever talks most is labelled "teacher"), which is a good default in a whole-class lesson but can mislabel a lesson that's mostly independent/group work.
- **Behaviour detection is pattern-based, not verified identity.** It only recognises phrasing it's been taught, will miss anything phrased differently, and resolves names against a placeholder roster (see above) — the confirm step exists precisely because misheard names and wrong-speaker attribution are expected, not edge cases.
- **Correlation ≠ causation.** Insights come with sample-size warnings. Class, topic and assessment difficulty are confounders.
- **Storage** is a single JSON file. Replace `src/lib/store.ts` with a real database before multi-user or serverless deployment. There is no authentication yet.
- **Data protection.** Recording in classrooms involves minors. Consent, retention and DPIA requirements must be settled with schools before any real use.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Anthropic SDK · Zod

## Design

Warm cream canvas, navy text and active navigation, coral primary actions, and rounded white cards, adapted from the supplied Together design specification. Cadence retains Geist and Geist Mono. The shared theme is `public/design-system.css`, imported by the app and the styled prototype at `/Cadence.html`. See [Cadence design system](docs/design/CADENCE_DESIGN_SYSTEM.md) for adaptations and preview instructions.


## Local prototype preview and progress

Use `npm ci` and `npm run dev`, then open [localhost:3000](http://localhost:3000). Set `CADENCE_DB_PATH=data/cadence-preview.json` in `.env.local` to keep a dedicated seeded preview. An absent database is seeded automatically with 12 synthetic lessons. No provider keys are needed for demo recording or transcript imports. Keep this server running while reviewing changes.

The implementation and remaining verification are tracked in [PROTOTYPE_PARITY_PLAN.md](PROTOTYPE_PARITY_PLAN.md). The frozen reference, responsive captures and checks live in `docs/parity/`. Navigation, charts, reports, review queues, assessment uploads and misconception details now use the prototype's compact layout. The real lesson list, provider status, re-analysis and recovery controls remain available.

Misconceptions group matching uses the same wording within a class. Addressed status is saved and new or changed observations reopen a group. Counts represent reported instances, rather than deduplicated students. Student answers are explicitly entered by a teacher; only demo lessons receive synthetic reference evidence. Replacing assessment CSV removes its previous notes/evidence, so copy anything needed before replacement.

Behaviour approvals are idempotent and can be undone; name selection does not approve an event. Tallies use the lesson date in Europe/London and distinguish the same name in different classes. Historical demo lessons therefore do not appear in today's tally.

## Parity verification

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Focused domain checks:

```bash
npx tsc --module commonjs --moduleResolution node --target es2022 --esModuleInterop --skipLibCheck --outDir /tmp/cadence-domain src/lib/misconceptions.ts src/lib/triangulate.ts src/lib/behaviour.ts src/lib/transcript.ts src/lib/analysis/heuristic.ts
node scripts/parity-domain-checks.mjs
```

API checks create and remove their own synthetic fixture. Run them against a separate local validation database, never the preview database:

```bash
CADENCE_DB_PATH=data/cadence-validation.json npm run start -- --port 3002
node scripts/parity-api-checks.mjs
```

The scripted checks require the seeded lessons and are restricted to localhost:3002. See `docs/parity/verification/VERIFICATION.md` for browser checks and outstanding hardware/provider validation.
