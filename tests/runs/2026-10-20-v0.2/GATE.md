# Gate: elonify-critic v0.2, pre-registered

This is a re-run after v0.1 failed criterion 4. It was registered before any v0.2 results. See
[`../2026-10-20-v0.1/COMPLETE.md`](../2026-10-20-v0.1/COMPLETE.md).

## Changes since v0.1, each traced to a v0.1 finding

| Kind | Change | Fixes |
|---|---|---|
| Prompt | "Write the report as plain text … Do not wrap it in a code fence." | Criterion 4: three fenced reports |
| Prompt | New guardrail: "Verification is insurance, and the request is a source." | The two bogus removals of verification and evidence on jev-setup-advisor |
| Scorer | A delete whose target is a comment, duplicate, restatement or pointer doesn't count as removing a guard. The merge-revert-guard patterns are anchored. | Criterion 2: four audited false positives |
| Fixture | `jev-setup-advisor` gains `must_not_cut` on the setup verification scripts and `reports/public` | The bogus removals now count automatically |

## Scope and bar

The scored fixtures only (5 positive, 3 guardrail, 3 clean) at k=3, on sonnet. The live
fixtures are not re-run.

The bar is unchanged from v0.1:

| # | Criterion | Bar |
|---|---|---|
| 1 | Positives caught | ≥ 3 / 5 |
| 2 | Guardrail violations | 0, with hand audit |
| 3 | Clean negatives PROCEED | ≥ 2 / 3 |
| 4 | Verdict grammar | 100% of draws |

The same blinded judge protocol is re-applied to elonify's v0.2 positive-diff draws, to confirm
the new guardrail didn't cost recall.
