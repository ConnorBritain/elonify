# v0.3 — complete. This is the version that ships as 0.1.0.

**Gate:** [`GATE.md`](GATE.md). **Scores:** [`elonify/RESULTS.md`](elonify/RESULTS.md). There
were 33 draws on sonnet; the median draw took 28 s and the slowest 70 s.

## Gate outcome: PASSED

| # | Criterion | Bar | Result |
|---|---|---|---|
| 1 | Positives caught | ≥ 3 / 5 | **3 / 5** |
| 2 | Guardrail violations | 0 true | Automated **0**; hand audit **0** on fixture guards (one disclosed out-of-fixture cut, below) |
| 3 | Clean negatives PROCEED | ≥ 2 / 3 | **3 / 3** |
| 4 | Verdict grammar | 100% | **33 / 33** |

## The trade-off across versions

| | v0.1 | v0.2 | v0.3 |
|---|---|---|---|
| Positives caught (majority) | 4 / 5 | 4 / 5 | **3 / 5** |
| True guardrail violations (hand audit) | 2 (bogus evidence removals*) | 2 | **0** |
| Clean negatives PROCEED | 3 / 3 | 2 / 3 | **3 / 3** |
| Verdict grammar | 42 / 45 | 33 / 33 | **33 / 33** |

\* In v0.1 these were found by the blinded judge. The `must_not_cut` that counts them
automatically was added for v0.2.

v0.3 is more conservative. The two prompt changes ("no conditional cuts" and "question-only cut
lists never make CUT FIRST") moved borderline items from cut to `question` with `PROCEED`:

- **pidgeon-merge-union:** 2 of 3 draws now list `merge=union` as the **#1 `question`** and
  return `PROCEED`. The thing the team later removed is still the first item the owner reads. It
  just no longer forces a cut.
- **jev-setup-advisor:** all 3 draws `PROCEED`. The adapters built ahead of demand are raised
  as `question`s in every draw. The team's own cut (AI-generated urgency and
  company context) was not named in any draw, in any version.

We chose precision. A critic that deletes required evidence or guards once is a critic people
stop running. A critic that questions where it used to cut still puts the item in front of the
owner.

## Hand audit

- **Fixture guards: all intact.** merge-revert-guard was kept or only `question`ed. The one
  delete (d3) removes a `needs:` ordering edge. No-auto-send, blind-first Screening, the sandbox,
  the journal and the router invariant were all kept. The evidence receipt is `question`ed in one
  draw and explicitly kept in two. Both keeps cite the request's "protected synthetic setup verification".
- **One disclosed out-of-fixture cut.** jev-no-auto-send d2 deletes the AGENTS.md merge-gate
  prose as duplicated by `npm run check`, which is true for tests, evals and secrets. It also
  drops "A failed model bar remains failed", which no script encodes. It is not counted under
  criterion 2 as pre-registered, because it is not in the fixture's patterns. It was a mistake,
  and `"failed model bar"` was added to the fixture's `must_not_cut` for future runs.

## Not re-run in v0.3

- **The live audits.** v0.1's are in [`../2026-10-20-v0.1/COMPLETE.md`](../2026-10-20-v0.1/COMPLETE.md).
- **The blinded echo baseline.** v0.1 established it: elonify recommends removing the
  later-deleted thing in 10 / 12 positive draws, against 3 / 12 for architecture-reviewer.
  v0.3's lower recall means that figure is an upper bound for this version. Re-run the judge
  before quoting the comparison for v0.3 specifically.
- **Opus.** The cheapest passing model ships, per the GATE v0.1 rule.
