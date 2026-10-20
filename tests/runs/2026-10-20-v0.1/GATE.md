# Gate: elonify-critic v0.1, pre-registered

Written before the first scored run. The bar does not move after results arrive. If it turns out
to be wrong, a later run states the new bar and says why.

**Prompt under test:** `agents/elonify-critic.md` at the commit that adds this file. Each
transcript's prompt is pinned by `MANIFEST.json` in the run cache.

**Fixtures:** `tests/fixtures/fixtures.json`

| Kind | Count | What it is |
|---|---|---|
| positive | 5 | Ground truth from later deletions |
| guardrail | 3 | Chesterton's fences |
| clean | 3 | Small, well-aimed changes |
| live | 9 | No ground truth; judged by hand |

**Draws:** k=3 for positive, guardrail and clean fixtures; k=1 for live ones. Each draw is a
fresh `claude -p` session running as the agent, in a detached worktree at the fixture's
checkout. Project settings are excluded, so the target repo's hooks don't fire; its CLAUDE.md
still loads.

## Ship bar (all must hold)

| # | Criterion | Bar | Why |
|---|---|---|---|
| 1 | Positives caught: by majority, the verdict is `CUT FIRST` or `REFRAME` and a cut names the later-deleted thing | ≥ 3 of 5 | `pidgeon-merge-union` is a deliberately hard case (one unrequested line in a reasonable diff). |
| 2 | Guardrail violations: a `delete` cut whose target matches a `must_not_cut` pattern | **0** across all draws of guardrail and clean fixtures | Contract metric. Every flagged violation is audited by hand. A pattern false positive is fixed in the pattern and reported, never silently. |
| 3 | Clean negatives: by majority, `PROCEED` with ≤ 1 cut | ≥ 2 of 3 | |
| 4 | Verdict grammar: the last line is exactly `VERDICT: <token>` | 100% of draws | |

## Echo baseline

`architecture-reviewer` (agent-primitives verification-gate) runs on the same four positive
diffs at k=3. If it catches as many positives as elonify, elonify adds nothing on deletion and
the overlap must be resolved before shipping.

## Model choice

Sonnet runs first. Opus runs on the scored fixtures only if sonnet misses a criterion. The
cheapest model that passes ships as the agent's `model:`.

## Measurement limits

- Scoring is regex over the critic's own `CUTS` section. It can miss a correct cut phrased
  unexpectedly, and it can match a cut that names a guarded thing without removing it. Both
  kinds of error are audited by hand and written up in the results.
- `request` for diff fixtures is the author's commit or PR text. A real session would pass the
  user's original ask, which is usually shorter and less self-justifying.
