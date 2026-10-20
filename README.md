# elonify

**A first-principles critic for decisions and diffs.** Before you build, it asks whether this is
the right problem and the least thing that solves it. After you build, it asks what should not
exist. It applies Musk's five-step algorithm **in order**:

1. Make the requirements less dumb, tracing each one to a named owner.
2. Delete.
3. Simplify.
4. Accelerate.
5. Automate.

The same steps work at every altitude: a module, an onboarding screen, a CI pipeline.

> "Possibly the most common error of a smart engineer is to optimize a thing that should not
> exist." — Elon Musk, Starbase tour, 2021

It is one read-only subagent, one skill, and one optional hook. It sits next to the
[agent-primitives](https://github.com/ConnorBritain/agent-primitives) `verification-gate` critics
and answers the question they don't: *should this exist, and is it aimed at what actually limits
progress?*

| | |
|---|---|
| **Catches** | Unowned requirements · things built ahead of any consumer · duplicates · "in case" generality · stubs that look finished · ceremony that records work instead of doing it · automation of things that should be deleted · work not aimed at the limiting factor |
| **Verdict** | `PROCEED` · `CUT FIRST` · `REFRAME` |
| **Kind / surface** | reviewer / agent (+ skill, + opt-in Stop hook) |
| **Not for** | Correctness bugs, test gaming (`verification-critic`), local code smells and boundaries (`architecture-reviewer`), taste |

## What a review looks like

Every review has the same shape, ending in one verdict token:

```
ALTITUDE: code
PROBLEM: Let a user activate loadouts into a project's harness config reversibly …
LIMITING FACTOR: correctness and trust of the reversible apply …   ON TARGET: yes
REQUIREMENTS:
- Writes refused outside $KITCTL_SANDBOX | source: PLAN.md, owner checklist | physics | keep
- warehouse commit recorded in the ledger | source: nobody (nothing reads it back) | recommendation | delete
CUTS:
1. STEP: delete
   TARGET: src/kitctl/engine.py:43 (JSON_TARGETS)
   EVIDENCE: grep finds only the definition; no reader
   REVERSIBLE: two-way
   IF WRONG: a generator needs the list — import it from there
KEEP:
- check_sandbox — recorded owner decision; only its duplication is a cut target
- journal + recover — crash test exists; data-integrity insurance
ADD-BACK WATCH: provenance questions from the pilot would revive the ledger-field cut
VERDICT: CUT FIRST
```

This is abridged from a real eval transcript on kitctl. The critic kept the sandbox and the
journal, and cut the dead weight around them.

## Method

The prompt lives in [`agents/elonify-critic.md`](agents/elonify-critic.md). The sourced canon,
with a provenance tag on every quote, is in [`PRINCIPLES.md`](PRINCIPLES.md).

| Step | Asks | Typical finding |
|---|---|---|
| 0. Right problem | What is the outcome? What constraint bounds progress right now? Is this aimed at it? | `REFRAME`: polishing onboarding while nobody can install the app |
| 1. Requirements | Who asked for each requirement, by name? Is it physics or a recommendation? | "source: nobody", so it's a deletion candidate |
| 2. Delete | What can go entirely? Overshoot, and expect to add some back. | A second copy of an app; an API with no caller |
| 3. Simplify | Only for what survived | Six copies of a module become one |
| 4. Accelerate | Where is the loop long? An idiot index, if it can be counted | "9 build steps for 1 deployable" |
| 5. Automate | Is anything automated that should be deleted? | An order violation |

**Guardrails.** Each one comes from a documented case of the method misfiring; see
[`PRINCIPLES.md`](PRINCIPLES.md) §7.

- **Chesterton's fence.** The critic checks `git log` and the docs before proposing a cut.
- **Physics is never cut unilaterally.** That covers safety, security, legal, accessibility,
  data integrity and recorded owner decisions.
- **Reversibility.** Every cut is marked two-way or one-way.
- **Redundancy is not waste.** Guards and invariants count as insurance, not overhead.
- **Direct controls stay direct.**
- **Deleting is not moving.**
- **At most 5 cuts, each with evidence.** On taste it stays silent, and `PROCEED` with nothing
  to cut is normal.

## Install

**Claude Code**

```
/plugin marketplace add ConnorBritain/elonify
/plugin install elonify@elonify
```

You can also load it from a checkout with `claude --plugin-dir /path/to/elonify`.

**Cursor:** the `.cursor-plugin/` manifest points at `agents/` and `skills/`. The tool
restriction degrades to prose, and the Stop hook is not wired.

**Codex / AGENTS.md:** there are no subagents and no turn blocking. Run the prompt in
[`wiring/agents-md.md`](wiring/agents-md.md) as a **fresh** `codex exec` (or a new session)
against the plan or diff. Never run it inline in the session that wrote the work.

## Use

```
/elonify:review                      # this turn's plan, else the working-tree diff
/elonify:review PLAN.md              # before building
/elonify:review main..HEAD           # after building
/elonify:review apps/web/onboarding --altitude ux      # surface audit
```

**Wire it in.** Installing the plugin does not make anything call it. Paste
[`wiring/claude-md.md`](wiring/claude-md.md) into your `CLAUDE.md`. That snippet runs the critic
at decision points, alongside `verification-critic` and `architecture-reviewer` when they're
installed. [`PROTOCOL.md`](PROTOCOL.md) explains when and why.

**Make it hard to skip (opt-in).** Add `.claude/elonify.json` to the project:

```json
{ "min_edits": 5, "block_on": ["REFRAME", "CUT FIRST"] }
```

The Stop hook then blocks a turn once in two cases:

- the turn made ≥ `min_edits` file edits, or approved a plan, and the critic did not run;
- the critic's verdict is in `block_on` and nothing changed afterwards.

There are three ways out: run the critic, act on its verdict, or end the turn with
`elonify: skip — <reason>` or `elonify: override — <reason>`. The hook is deterministic and
never calls a model. If the hook itself fails, it does not block.

## Cost

One subagent run per review. It reads the plan or diff, greps, and checks `git log` to test
fences. In the v0.3 eval, a sonnet review took a median of 28 s, and the slowest took 70 s, on
diffs up to about 2.6k lines and repos up to about 25k files. Skip trivial turns.

## Evaluation

See [`tests/runs/2026-10-20-v0.1/`](tests/runs/2026-10-20-v0.1/). The gate (`GATE.md`) was
registered before any results.

There are 20 fixtures across three real repos (jev-spike, pidgeon and kitctl). The scored fixtures come in three kinds:

- **Positives:** the team itself later deleted what the target added, which gives ground truth.
- **Guardrails:** load-bearing guards that look like overhead.
- **Clean negatives:** small, well-aimed changes, several of which are themselves deletions.

The live fixtures are human-judged audits of the current repos. `architecture-reviewer` runs on
the same positive diffs as an echo baseline.

**Shipped prompt (v0.3, sonnet, 33 draws). Every number below comes from `eval.mjs collect`
plus a hand audit:**

| Criterion | Bar | Result |
|---|---|---|
| Positives: `CUT FIRST`/`REFRAME` naming the thing the team later deleted (majority of 3) | ≥ 3 / 5 | **3 / 5** |
| Guardrail violations: a load-bearing guard proposed for deletion | 0 | **0** |
| Clean negatives: `PROCEED` | ≥ 2 / 3 | **3 / 3** |
| Verdict grammar | 100% | **33 / 33** |

**Against the existing critic** (v0.1, blinded judge, same 4 positive diffs × 3 draws): elonify
recommended removing, or explicitly questioned, the later-deleted thing in **10 of 12** draws,
usually as finding #1–2. `architecture-reviewer` did so in **3 of 12**, all on one diff and
ranked as a nit. On the other three diffs it proposed **fixing** what the team later
**deleted**: "point the hook at the right .sln", "wire the customer ID".

**How it got here.** Each version was gated before results, and each failure was fixed at its
root:

- **v0.1** failed on format: fenced reports.
- **v0.2** failed on guardrails. Two draws cut committed evidence "if nothing requires it", and
  the repo's AGENTS.md required it.
- **v0.3** passes. Its operational guardrail is to search the repo rules and quote them before
  cutting verification, with no conditional cuts.

That traded some recall (4/5 → 3/5) for zero guardrail violations. See
[`tests/runs/README.md`](tests/runs/README.md).

**Dogfood.** elonify reviewed this repo. Given only the original request, it proposed cutting
the Stop hook and the multi-harness packaging, which the user had explicitly chosen. That is why
`/elonify:review` now passes later user decisions to the critic verbatim
([`DOGFOOD.md`](tests/runs/2026-10-20-v0.2/DOGFOOD.md)).

## Known limits

- **Judgement, not proof.** Whether a requirement is "dumb" has no ground truth. The eval can
  check deletions the team later made and guards that must survive. It cannot certify that a
  cut is right. Each cut carries evidence and an add-back trigger so a person can decide quickly.
- **It only sees the repo.** A cut can look safe because the consumer lives elsewhere (another
  repo, a customer, a dashboard). The critic is told to say so when it can't check, and the
  one-way/two-way marking is the backstop.
- **The original request matters.** Given a builder's summary instead of the user's words, the
  critic inherits the builder's framing. The skill passes the request verbatim. Other ways of
  invoking it should too.
- **The hook counts; it does not understand.** It knows that edits happened and that a verdict
  exists. It does not know whether the edits addressed the cuts. The release phrases make the
  reason visible to whoever reads the transcript.
- **Harness degradation.** Enforcement is real in Claude Code, partial in Cursor, and advisory in
  Codex and AGENTS.md. See `meta.yaml`.
- **Not `claude plugin eval`.** That runner works in throwaway scaffolds. This eval needs real
  repos pinned to historical commits, including a private one, and scores against what the team
  later deleted. Add a `claude plugin eval` suite if the skill's triggering or wiring needs
  regression tests.

## Layout

```
agents/elonify-critic.md   the prompt (source of truth)
skills/review/SKILL.md     /elonify:review — resolve target, pass request verbatim, spawn critic
hooks/                     opt-in Stop gate (deterministic)
wiring/                    CLAUDE.md and AGENTS.md snippets; agents-md carries the full prompt
PRINCIPLES.md              sourced canon + failure modes
PROTOCOL.md                when to run, relation to sibling critics
meta.yaml                  contract + per-harness enforcement
tests/                     selftest (CI), eval harness, fixtures, pre-registered runs
```

The following were deliberately not built, each with the condition for adding it back:

- **A `primitives/` vs `bundles/` split.** Add it if this joins the agent-primitives monorepo.
- **`commands/`.** The skill is already slash-invocable. Add commands if Cursor needs them.
- **A deterministic diff-stat scanner.** Add one if evals show the critic inventing numbers.
- **A model-calling hook.** Add one if the deterministic gate proves too blunt.

MIT © Connor England
