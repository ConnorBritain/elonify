---
name: review
description: Run the elonify critic, which applies Musk's algorithm in order (question requirements → delete → simplify → accelerate → automate) to a plan, decision, diff, or surface. It answers whether the work is aimed at the limiting factor and what to cut first. Use before building (on a plan or decision) and after building (on a diff), at code, UI/UX, or workflow altitude.
argument-hint: "[plan-file | git-range | path] [--altitude code|ux|workflow]"
---

# elonify review

Run `elonify-critic` against a target in a **clean context** and relay its verdict.

The critic must not be the writer. A review of work run in the same context that produced it tends to rationalise that work. So this skill never applies the method inline: it hands the work to the critic, and the critic does the reviewing.

## 1. Resolve the target

Read `$ARGUMENTS`:

- **A file path to a plan or doc** (`PLAN.md`, `docs/rfc-*.md`, a plan-mode file): this is a pre-build review. The target is that file.
- **A git range or SHA** (`main..HEAD`, `HEAD~3..`, `abc123`): this is a post-build review. The target is that range.
- **A directory or surface path** (`apps/web/app/onboarding`, `src/cli.py`, `.github/workflows`): this is a surface audit. The target is that path.
- **Empty**: if the turn wrote a plan, use the plan. Otherwise use the working-tree diff (`git diff` plus `git diff --staged`). If both are empty, ask what to review.
- **`--altitude`**: pass it through if given. Otherwise the critic detects the altitude.

## 2. Gather the original request, verbatim

Copy the user's original ask word for word, from the message that started this work. If the work came from a ticket, an issue, or a roadmap slice, quote that instead.

Do **not** summarise it. A summary written by the session that did the work is exactly the framing the critic exists to question.

## 3. Spawn the critic

In Claude Code, launch the `elonify-critic` subagent with this prompt:

```
ORIGINAL REQUEST (verbatim):
<the request>

TARGET:
<path, range, or "working-tree diff">

ALTITUDE: <if given, else omit>
```

Add nothing else, such as your own assessment, a list of what you think is fine, or hints. Run it in parallel with `verification-critic` and `architecture-reviewer` when those are installed and the target is a diff.

In other harnesses that have no subagents (Codex, or a plain AGENTS.md harness), run the prompt in `wiring/agents-md.md` as a **fresh** process against the target, for example `codex exec`. Do not run it inline.

## 4. Relay the verdict

Report the critic's `VERDICT:` line and its cuts as written. Don't soften them, re-rank them, or add your own.

- `PROCEED`: carry on.
- `CUT FIRST`: make the cuts, or say for each one why it stays, before continuing.
- `REFRAME`: stop and put the reframing question to the user. Don't decide it yourself.

You may disagree with a cut. If you do, say so in one line with your evidence, and leave the decision to the user.
