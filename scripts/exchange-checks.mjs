// Run after:
//   npx tsc --module commonjs --moduleResolution node --target es2022 --esModuleInterop --skipLibCheck \
//     --outDir "$RELAY_CHECK_DIR" src/lib/exchanges.ts src/lib/misconceptions.ts src/lib/analysis/heuristic.ts
// Covers teacher-question → student-reply pairing, verification of judged misconceptions against the
// transcript, aggregation into misconception groups, and addressed/reopen behaviour. No API calls.
import assert from "node:assert/strict";
const root = process.env.RELAY_CHECK_DIR || "/tmp/relay-domain";
const { pairExchanges, attachJudgements, locateQuote } = await import(root + "/exchanges.js");
const { groupMisconceptions, groupInstances } = await import(root + "/misconceptions.js");
const { heuristicAnalysis } = await import(root + "/analysis/heuristic.js");

let t = 0;
const seg = (id, speaker, text) => ({ id, start: t, end: (t += 5), speaker, text });
const lesson = [
  seg("s1", "teacher", "Question one: what did we learn last lesson about equivalent fractions? Hands down, I'm going to pick."),
  seg("s2", "teacher", "Amara?"),
  seg("s3", "student", "You multiply the top and bottom by the same number."),
  seg("s4", "teacher", "That's right because the ratio stays the same. How do you know the value doesn't change?"),
  seg("s5", "student", "Because it's like multiplying by one."),
  seg("s6", "teacher", "Everyone ready?"),
  seg("s7", "student", "Yes."),
  seg("s8", "teacher", "Why is two thirds plus one quarter not three sevenths?"),
  seg("s9", "student", "You just add the tops and add the bottoms."),
  seg("s10", "student", "Because that's how you add."),
  seg("s11", "teacher", "Now your turn. Work on your own."),
  seg("s12", "student", "Can we use calculators?"),
  seg("s13", "teacher", "Six?"),
  seg("s14", "student", "Six."),
];

// --- pairing -------------------------------------------------------------------------------
const { exchanges, note } = pairExchanges(lesson);
assert.equal(note, undefined);
assert.equal(exchanges.length, 3, "nomination, open question, multi-segment reply; not the procedural check");
const [a, b, c] = exchanges;
assert.equal(a.nomination, "Amara?");
assert.match(a.question, /equivalent fractions/);
assert.equal(a.questionSegmentId, "s1", "nominated question is attributed to the segment that asked it");
assert.deepEqual(a.responseSegmentIds, ["s3"]);
assert.match(b.question, /how do you know/i);
assert.equal(b.response, "Because it's like multiplying by one.");
assert.deepEqual(c.responseSegmentIds, ["s9", "s10"], "consecutive student segments are one reply");
assert.equal(c.response, "You just add the tops and add the bottoms. Because that's how you add.");
assert.ok(!exchanges.some((e) => /ready/.test(e.question)), "procedural question is not an exchange");
assert.ok(!exchanges.some((e) => e.responseSegmentIds.includes("s12")), "student asking a question is not a reply");
assert.ok(!exchanges.some((e) => e.responseSegmentIds.includes("s14")), "echoed 'Six?' with no question before it is skipped");
assert.equal(new Set(exchanges.map((e) => e.id)).size, exchanges.length, "ids are unique");

// A procedural check straight after an unanswered question must not be mistaken for a nomination
// of that question (regression: any 1-2 word question used to count as a nomination).
t = 0;
const stray = pairExchanges([
  seg("p1", "teacher", "Why does a common denominator work?"),
  seg("p2", "teacher", "Everyone ready?"),
  seg("p3", "student", "Yes."),
  seg("p4", "teacher", "Jamal?"),
  seg("p5", "student", "Because the pieces are the same size."),
]);
assert.equal(stray.exchanges.length, 0, "'Yes.' answers a procedural check; 'Jamal?' cannot reach back across a student turn");
assert.ok(!stray.exchanges.some((e) => e.response === "Yes."));

// Honest handling of transcripts that cannot be paired.
const unlabelled = pairExchanges([seg("u1", "unknown", "What is a noun?"), seg("u2", "unknown", "A thing.")]);
assert.equal(unlabelled.exchanges.length, 0);
assert.match(unlabelled.note, /No student speech was labelled/);
assert.match(pairExchanges([seg("t1", "teacher", "Hello.")]).note, /No student speech/);
assert.match(pairExchanges([seg("x1", "student", "Hi."), seg("x2", "student", "Hello.")]).note, /No teacher speech/);

// --- quote verification --------------------------------------------------------------------
assert.equal(locateQuote("add the tops and add the bottoms", c, lesson), "s9");
assert.equal(locateQuote("ADD THE TOPS, and add the bottoms!", c, lesson), "s9", "case/punctuation tolerant");
assert.equal(locateQuote("add the bottoms. Because that's how", c, lesson), "s9", "straddling quote -> first segment");
assert.equal(locateQuote("you multiply denominators", c, lesson), null, "invented quote rejected");
assert.equal(locateQuote("   ", c, lesson), null);

const MC = "Adds numerators and denominators separately";
const judged = attachJudgements(
  exchanges,
  [
    { exchangeId: a.id, verdict: "correct", rationale: "Right idea.", misconception: null },
    // misconception attached to a correct verdict is inconsistent -> tag dropped
    { exchangeId: b.id, verdict: "correct", rationale: "Good.", misconception: { label: "X", quote: "multiplying by one" } },
    { exchangeId: c.id, verdict: "incorrect", rationale: "Adds across.", misconception: { label: ` ${MC} `, quote: "add the tops and add the bottoms" } },
    { exchangeId: "ex-does-not-exist", verdict: "incorrect", rationale: "?", misconception: null },
  ],
  lesson,
);
assert.equal(judged.length, 3);
assert.equal(judged[0].verdict, "correct");
assert.equal(judged[1].misconception, undefined);
assert.match(judged[1].rationale, /discarded/);
assert.deepEqual(judged[2].misconception, { label: MC, quote: "add the tops and add the bottoms", segmentId: "s9" });
const fabricated = attachJudgements(
  [c],
  [{ exchangeId: c.id, verdict: "incorrect", rationale: "r", misconception: { label: MC, quote: "they said denominators stay" } }],
  lesson,
)[0];
assert.equal(fabricated.verdict, "incorrect", "verdict survives");
assert.equal(fabricated.misconception, undefined, "fabricated quote never reaches the UI");
assert.equal(attachJudgements([a], [], lesson)[0].verdict, "unjudged", "skipped exchanges stay unjudged");

// --- aggregation ---------------------------------------------------------------------------
const mk = (id, yearGroup, extra = {}) => ({
  id, title: `Lesson ${id}`, date: "2026-10-06T12:00:00Z", source: "import", yearGroup, behaviourEvents: [],
  assessment: null, analysis: { exchanges: [] }, ...extra,
});
const withHeard = (id, yearGroup) =>
  mk(id, yearGroup, { analysis: { exchanges: judged } });
const typed = mk("typed", "Year 9", {
  assessment: { misconceptions: [{ id: "m1", text: MC, studentCount: 6 }] },
});
let groups = groupMisconceptions([typed, withHeard("heard", "Year 9"), withHeard("other", "Year 8")]);
const y9 = groups.find((g) => g.yearGroup === "Year 9");
assert.equal(groups.length, 2, "same idea in different classes stays separate");
assert.equal(y9.reportedCount, 6);
assert.equal(y9.heardCount, 1);
assert.equal(groupInstances(y9), 7);
assert.equal(y9.lessons.length, 2, "typed note and heard reply both link their lessons");
const heardEv = y9.evidence.find((e) => e.provenance === "transcript");
assert.equal(heardEv.student, "Unidentified student", "no student is named from a transcript");
assert.equal(heardEv.answer, "add the tops and add the bottoms");
assert.equal(heardEv.segmentId, "s9");
assert.match(heardEv.question, /two thirds/i);

// Unjudged / heuristic exchanges never create misconceptions.
assert.equal(
  groupMisconceptions([mk("h", "Year 9", { analysis: { exchanges: exchanges.map((e) => ({ ...e, verdict: "unjudged" })) } })]).length,
  0,
);

// Addressed state: stable across identical re-reads, reopened by a genuinely new observation.
const followUp = { groupId: y9.id, addressedAt: "2026-10-07T00:00:00Z", addressedObservations: y9.observations };
const again = groupMisconceptions([typed, withHeard("heard", "Year 9")], [followUp]);
assert.equal(again.find((g) => g.id === y9.id).addressed, true);
const withNew = groupMisconceptions([typed, withHeard("heard", "Year 9"), withHeard("later", "Year 9")], [followUp]);
assert.equal(withNew.find((g) => g.id === y9.id).addressed, false, "new heard reply reopens the group");

// --- pattern engine ------------------------------------------------------------------------
const h = heuristicAnalysis(lesson);
assert.equal(h.exchanges.length, 3);
assert.ok(h.exchanges.every((e) => e.verdict === "unjudged" && !e.misconception), "heuristic never judges or invents");
assert.match(h.exchangeNote, /cannot judge/);
assert.match(heuristicAnalysis([seg("q", "unknown", "What is a noun?")]).exchangeNote, /No student speech/);

console.log("exchange checks passed");
