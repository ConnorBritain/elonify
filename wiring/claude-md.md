# Wiring elonify into CLAUDE.md

Paste the block below into your project's `CLAUDE.md`. Without it the critic is installed, but
nothing calls it at the right moments. The model would not choose to run a check that might
answer "you should not have built this", because running it works against its local interest.
That is the only reason this needs protocol binding.

```markdown
## First-principles gate   <!-- elonify -->

At a decision point — before building from a plan, and before declaring non-trivial work done —
run `/elonify:review` on the plan or diff, passing the user's original request verbatim. When
`verification-critic` / `architecture-reviewer` are installed, run elonify in parallel with them
on the diff. `CUT FIRST` means make the cuts (or say for each why it stays) before continuing;
`REFRAME` means put the question to the user rather than deciding it. Trivial turns (typo,
version bump, a one-line fix) skip the gate — say so when you do.
```

## Notes

- The block states the trigger and the consequence, and nothing else. The method lives in the
  agent file, and restating it here would create two copies that drift apart.
- Paste it once. It is idempotent and works on its own, so re-pasting is harmless.
- To make the gate hard to skip, opt into the Stop hook with `.claude/elonify.json`:
  `{ "min_edits": 5, "block_on": ["REFRAME", "CUT FIRST"] }`. The hook blocks once per stop. The
  ways out are running the critic, editing after a verdict, or ending the turn with
  `elonify: skip — <reason>` or `elonify: override — <reason>`.
- The skip exemption is deliberate. A gate that fires on everything gets routed around.
