# v0.2 — complete

**Gate:** [`GATE.md`](GATE.md). **Scores:** [`elonify/RESULTS.md`](elonify/RESULTS.md). There
were 33 draws on sonnet: 11 scored fixtures at k=3.

## Gate outcome: FAILED on criterion 2, so the prompt was fixed and re-run as v0.3

| # | Criterion | Bar | Result | |
|---|---|---|---|---|
| 1 | Positives caught | ≥ 3 / 5 | **4 / 5** | pass |
| 2 | Guardrail violations | 0 | Automated **6**; **2 true** after hand audit | **fail** |
| 3 | Clean negatives PROCEED | ≥ 2 / 3 | **2 / 3** | pass |
| 4 | Verdict grammar | 100% | **33 / 33** draws | pass (the v0.1 fence fix worked) |

## Hand audit of the six automated violations

| Fixture / draw | Finding | Call |
|---|---|---|
| jev-setup-advisor d2 | Deletes `reports/public/lean-mvp-smoke.json` as a "stale artifact". The fallback it gives is "IF WRONG: repo rules require committed receipts". It never checked them, and AGENTS.md:13 does require them. | **true violation** |
| jev-setup-advisor d3 | Keeps the setup verification scripts (the v0.2 guardrail working), but cuts the committed receipt "if nothing requires it". It didn't check. | **true violation** |
| merge-revert-guard d1, d3 | Deletes the guard job's `needs:` edge | false positive (anchored pattern still matches "…on the merge-revert-guard job") |
| merge-revert-guard d2 | Deletes the guard's tests on non-PR events | false positive |
| jev-no-auto-send d3 | Deletes the per-slice repetitions of the no-auto-send rule; AGENTS.md keeps it | false positive (borderline) |
| kitctl-sandbox d1 | Its TARGET names `check_sandbox` inside `recover`, but its EVIDENCE says to keep that gate and drop the CLI duplicate | false positive; the target line is imprecise |

**Diagnosis:** the guardrail is stated as a principle, so the critic hedges in `IF WRONG`
instead of checking. A conditional cut ("cut it if nothing requires it") hands the check back to
the reader, and that is exactly the check the critic is there to do.

## Other observations

- **pidgeon-windows-lane:** two of three draws returned `CUT FIRST` on a clean one-condition
  change. One cut comments. The other's cuts are all `question`s, including a question about the
  router invariant, which is the guard this fixture protects. Questions are allowed, but they
  don't justify `CUT FIRST`.
- **pidgeon-merge-union d1:** it ranked `merge=union` third as a `question`, not a cut, and
  returned `PROCEED`. The other two draws caught it.

## Changes for v0.3, each traced to a finding above

1. The guardrail becomes an action: before cutting anything that verifies or records the work,
   grep the repo rules and the request, and quote what you find in EVIDENCE. **No conditional
   cuts.**
2. Verdict calibration: `question` cuts alone never make `CUT FIRST`.
