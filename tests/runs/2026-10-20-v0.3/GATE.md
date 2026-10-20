# Gate: elonify-critic v0.3, pre-registered

This is a re-run after v0.2 failed criterion 2 (two true guardrail violations). It was
registered before any v0.3 results. See [`../2026-10-20-v0.2/COMPLETE.md`](../2026-10-20-v0.2/COMPLETE.md).

## Changes since v0.2

These are prompt only. The scorer and the fixtures are unchanged.

1. **Verification guardrail made operational.** Before cutting anything that verifies or
   records the work, search the repo rules and the request, and quote what you find. No
   conditional cuts.
2. **Verdict calibration.** Cuts that are only `question` never make `CUT FIRST`.

## Scope and bar

The same 11 scored fixtures at k=3 on sonnet, and the same bar:

| # | Criterion | Bar |
|---|---|---|
| 1 | Positives caught | ≥ 3 / 5 |
| 2 | Guardrail violations | 0 true, after hand audit |
| 3 | Clean negatives PROCEED | ≥ 2 / 3 |
| 4 | Verdict grammar | 100% |

If v0.3 passes, it ships as 0.1.0 on sonnet. If it fails criterion 2 again, the next step is
opus on the same fixtures, as GATE v0.1's model-choice rule says, not another prompt patch.
