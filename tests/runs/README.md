# Eval runs

Each run has a `GATE.md` registered before results, generated `*/RESULTS.md` and
`results.json` from `node tests/eval.mjs collect`, and a hand-written `COMPLETE.md` that audits
the result. Raw transcripts live in `tests/.cache/` (gitignored). One fixture repo is private,
so transcripts are never committed.

| Run | Outcome | What changed next |
|---|---|---|
| [2026-10-20-v0.1](2026-10-20-v0.1/COMPLETE.md) | Failed grammar (3 fenced reports). Blinded echo baseline: 10/12 vs 3/12. | No code fences; verification guardrail; scorer false-positive fixes |
| [2026-10-20-v0.2](2026-10-20-v0.2/COMPLETE.md) | Failed guardrails (2 conditional cuts of required evidence) | Operational guardrail; question-only lists never make CUT FIRST |
| [2026-10-20-v0.3](2026-10-20-v0.3/COMPLETE.md) | **Passed**; ships as 0.1.0 | Precision up, recall down |

Also see [`2026-10-20-v0.2/DOGFOOD.md`](2026-10-20-v0.2/DOGFOOD.md), elonify reviewing its own
repo. That run is why the review skill passes later user decisions to the critic.
