# Protocol

How `elonify-critic` is meant to be run. There is no orchestrator: the main session follows this
protocol, and the `/elonify:review` skill packages it.

## The problem

Agents, and people, are rewarded for producing. Nobody gets credit for the part that was never
built, so work accretes. Plans grow integrations "for later". Diffs add options "in case".
Workflows add a step after every incident and never remove one. The most expensive version of
this is careful, well-tested work on something that should not exist. Existing reviewers judge
whether the work is correct or well structured. None of them ask whether it should exist.

## Two moments

```
 request ──► plan ──► [elonify: plan]  ──► build ──► gates ──► [verification-critic]
                         │                                    [architecture-reviewer]  ─► done
                         │                                    [elonify: diff]
                         ▼
                 REFRAME → ask the owner
                 CUT FIRST → shrink the plan, then build
```

1. **Before building**, on the plan or decision. This is where elonify is worth the most: a cut
   here costs a paragraph, while the same cut after building costs a revert.
2. **After building**, on the diff. Run it in parallel with `verification-critic` and
   `architecture-reviewer` after the Tier-1 gates (tests, typecheck) are green.

Surface audits are a third use, for a screen, a CLI, a CI directory or a docs set. They are
on demand (`/elonify:review apps/web/app/onboarding`), not protocol-bound.

## Rules

- **Clean context.** The critic is never the session that wrote the plan or the diff. A session
  that reviews its own plan defends it.
- **Pass the original request verbatim.** The critic exists to question how the requester and
  the builder framed the work. A summary written by the builder is that framing again, minus
  whatever got lost.
- **Gates before critics.** Don't spend a review on a diff that doesn't compile.
- **Relay the verdict, don't re-rank it.** The session may disagree with a cut in one line,
  with evidence. The decision belongs to the user.
- **`REFRAME` goes to a human.** A wrong-problem verdict is a question for whoever owns the goal.
  The session must not quietly decide it.
- **Skip trivial turns, and say so.** A typo, a version bump or a one-line fix doesn't need a
  first-principles review. A gate that fires on everything gets routed around.

## Verdicts

| Verdict | Meaning | What the session does |
|---|---|---|
| `PROCEED` | Aimed at the limiting factor; nothing material to cut first | Continue. Optional cuts may be noted. |
| `CUT FIRST` | At least one evidenced cut or order violation | Make the cuts, or state for each why it stays, before continuing |
| `REFRAME` | Wrong problem, not the limiting factor, or a core requirement nobody owns | Stop. Put the question to the user. |

## Relation to sibling critics

| Critic | Question | Owns |
|---|---|---|
| `verification-critic` | Was the task done, or was the check gamed? | Weakened tests, harness escapes, spec-over-tests |
| `architecture-reviewer` | Is the structure of this code sound? | God objects, local duplication, boundary violations, dead code in the diff |
| `elonify-critic` | Should this exist, and is it aimed at what limits progress? | Unowned requirements, things to delete, order violations, idiot index, limiting factor |

The overlap is deliberate but narrow. When a whole unit should not exist, elonify reports it
even if architecture-reviewer would also call it premature abstraction. Elonify does not report
local code smells.

## Making it stick

These are the three ways this protocol fails:

1. **Running the critic in the writer's context.** The review becomes a defence. Use a
   subagent, a `codex exec` subprocess, or a fresh session.
2. **Firing on everything.** It becomes noise, gets ignored, and costs as much as not having it.
   Keep the trivial-turn skip.
3. **Letting the builder self-report the verdict.** The opt-in Stop hook reads the verdict from
   the critic's own output, not from the builder's summary of it.
