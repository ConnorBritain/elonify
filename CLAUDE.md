# elonify — working rules

This repository is one Claude Code plugin (also packaged for Cursor, Codex and AGENTS.md
harnesses). It follows the conventions of ConnorBritain/agent-primitives.

- `agents/elonify-critic.md` is the source of truth for the prompt. `wiring/agents-md.md`
  carries the same body verbatim, and `node tests/selftest.mjs` fails if they drift.
- The version must be identical in all four `plugin.json` files and the marketplace entry.
- The hook never calls a model, never blocks on its own failure, honours `stop_hook_active`, and
  has a selftest case for every path. Add the case before the branch.
- Numbers in docs come from `node tests/eval.mjs collect` output, never typed by hand. Change
  the prompt, then re-run the gate (`tests/runs/<id>/GATE.md` first, results second).
- Before declaring a change done, run `node tests/selftest.mjs`.

## First-principles gate   <!-- elonify -->

At a decision point — before building from a plan, and before declaring non-trivial work done —
run `/elonify:review` on the plan or diff, passing the user's original request verbatim. When
`verification-critic` / `architecture-reviewer` are installed, run elonify in parallel with them
on the diff. `CUT FIRST` means make the cuts (or say for each why it stays) before continuing;
`REFRAME` means put the question to the user rather than deciding it. Trivial turns (typo,
version bump, a one-line fix) skip the gate — say so when you do.
