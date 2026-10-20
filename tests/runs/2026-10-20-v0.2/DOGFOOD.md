# Dogfood: elonify-critic on its own repository

Two runs on sonnet against the v0.2 prompt, before the v0.2 gate results. Run 1 got only the original request. Run 2 also got the user's planning decisions, verbatim.

Run 1 proposed deleting the Stop hook and the non-Claude packaging, which contradicts decisions the user made explicitly. The critic hadn't been shown them. That led to the `/elonify:review` change: the skill now passes later user decisions verbatim alongside the request. In run 2 the hook moved to KEEP as "a recorded owner decision".

## Run 1 (request only)

ALTITUDE: code, workflow
PROBLEM: Reviews of "does this work need to exist" are missing from agent turns, so work accretes. The user wants a critic that applies Musk's algorithm and sits at the end of nearly any turn, with high signal and low noise.
LIMITING FACTOR: Whether the critic's verdicts are right and actually get acted on. The v0.1 eval measured the verdicts. v0.2 is still unrun, and its GATE.md is the only file in that run directory. Nothing yet measures whether any sessions follow the verdicts.  ON TARGET: yes (the core critic, the skill, and the eval); the surrounding packaging is not.

REQUIREMENTS:
- A critic that runs the algorithm in order and ends with a parseable verdict | source: request, "takes the principles… audit/review tool… reviewer critic" | physics (the request asks for it) | keep
- Runs at the end of almost any turn | source: request, "attached to the end of just about any turn" | recommendation | keep. The CLAUDE.md block already covers it, though with "non-trivial work" and trivial-turn exemptions rather than every turn.
- Packaging for four harnesses (.claude-plugin, .codex-plugin, .cursor-plugin, .plugin) plus marketplace.json | source: CLAUDE.md, "also packaged for Cursor, Codex and AGENTS.md harnesses", which cites a convention in another repo | recommendation | question. The request names one plugin, and the repo shows no Cursor or Codex user.
- Opt-in Stop hook with edit counting, plan counting, verdict parsing and state files | source: nobody; the request doesn't ask for enforcement | recommendation | delete
- Separate PROTOCOL.md, PRINCIPLES.md, README.md, wiring/claude-md.md, and the CLAUDE.md gate block | source: nobody. Several of these say the same thing, and the CLAUDE.md block is pasted verbatim into wiring/claude-md.md | recommendation | delete
- Pre-registered gate, eval harness, and fixtures | source: nobody named in the request. The v0.1 result is the only evidence the critic works, and the prompt claims are anchored to it. | recommendation | keep, but shrink
- Verification and evidence guardrail | source: v0.1 audit found two bogus removals of required evidence | physics | keep

CUTS:
1. STEP: delete
   TARGET: hooks/elonify-hook.mjs (173 lines), hooks/hooks.json (27), and the hook cases in tests/selftest.mjs (218 lines in total), until a trigger problem is observed.
   EVIDENCE: This is automation built ahead of any measured need, which makes it an order violation. The v0.1 COMPLETE.md measures only critic quality (4/5 positives, 3/3 clean). It never measures how often the critic is skipped, and the hook only matters if the CLAUDE.md rule is skipped. The hook uses a counter heuristic (`min_edits` of 5). It adds a second way to end a turn (`elonify: skip — <reason>`), so more ceremony text can appear in final messages. The hook's own header says it is opt-in, so it is off by default. I found no config that opts anyone in. No git history shows the rule being skipped; there are 3 commits in total.
   REVERSIBLE: two-way
   IF WRONG: sessions in repos with the CLAUDE.md block repeatedly end non-trivial turns with no critic run. Count those turns before restoring it.

2. STEP: delete
   TARGET: .codex-plugin/plugin.json (25 lines), .cursor-plugin/plugin.json (12), .plugin/plugin.json (9), wiring/agents-md.md (109 lines, a verbatim copy of the agent body), and the drift check in tests/selftest.mjs
   EVIDENCE: CLAUDE.md says the agent file is the source of truth and that `wiring/agents-md.md` "carries the same body verbatim", so there are two copies plus a test to keep them in sync. The same rule requires the version to match in four plugin.json files plus the marketplace entry. That is five places to bump for one version, and the second harness has no recorded user. Re-add each harness when someone asks for it.
   REVERSIBLE: two-way
   IF WRONG: a named Codex or Cursor user asks for it.

3. STEP: delete
   TARGET: PROTOCOL.md (77 lines), wiring/claude-md.md (28), meta.yaml (58), and the duplicated sections of README.md (194 lines)
   EVIDENCE: The CLAUDE.md gate block appears in both CLAUDE.md and wiring/claude-md.md. PROTOCOL.md's "Two moments" and "Rules" restate skills/review/SKILL.md steps 1–4: clean context, verbatim request, relay the verdict. The same protocol therefore lives in three places. Docs total about 580 lines against a 92-line agent file. The README can hold the one paste-in block and a pointer to the agent.
   REVERSIBLE: two-way
   IF WRONG: a user cannot work out when to run the critic from the README alone.

4. STEP: simplify
   TARGET: PRINCIPLES.md (186 lines) and the table in agents/elonify-critic.md
   EVIDENCE: PRINCIPLES.md states "The critic's prompt paraphrases this document; it does not quote it." It is background reading that the critic never loads. It also admits its sources are "search results only — no primary page… was opened". Keep the failure-mode table (§7), which traces each guardrail to a documented case, and move the rest of the quote canon into the README or drop it. Unverified quotes are a liability in a published plugin.
   REVERSIBLE: two-way
   IF WRONG: someone challenges a guardrail and there is nowhere to see why it exists.

5. STEP: reorder
   TARGET: tests/eval.mjs (314 lines), tests/fixtures/fixtures.json (336 lines), and the 9 live fixtures
   EVIDENCE: The v0.2 GATE.md exists but has no results. It cites v0.1 failing criterion 4 only on a code-fence format issue, then re-runs all 11 scored fixtures at k=3. The fix was one sentence in the prompt. Run the v0.2 gate before adding anything else, and stop writing GATE.md files per revision. Keep the scored fixtures that produced the findings; drop the live fixtures that have no ground truth (they are judged by hand and nobody re-runs them). The regex scorer already needed a fix in v0.2, so keep the hand audit.
   REVERSIBLE: two-way
   IF WRONG: a prompt change regresses and no fixture catches it.

KEEP:
- agents/elonify-critic.md and skills/review/SKILL.md — they are the product, and the request asks for exactly this.
- The "verification is insurance" guardrail — v0.1 shows it was added after the critic cut required evidence.
- The tests that touch the verdict parser — the grammar criterion depends on them. If the hook goes, move `parseVerdict` into a test of its own or drop it.
- The failure-mode table in PRINCIPLES.md §7 — Chesterton's fence for the guardrails.
- CI selftest — it is 14 lines and cheap.

ADD-BACK WATCH: How often non-trivial turns end without a critic run once the hook is gone. How often verdicts are acted on versus overridden. Any request for Codex or Cursor support. The v0.2 gate result (criterion 4 at 100% of draws).

VERDICT: CUT FIRST

## Run 2 (request + user decisions)

ALTITUDE: code, workflow
PROBLEM: Reviewers and builders add parts, steps and docs that deliver no value. The user wants a portable end-of-turn critic that finds what to delete, and wants evidence that it works on their real repos.
LIMITING FACTOR: Whether the critic's cuts are correct and trusted, meaning it catches real deletions without cutting guarded things. v0.1 shows this: gate 3 of 4 criteria passed, 4 of 5 positives caught, 2 bogus removals on the jev-setup-advisor fixture. Packaging reach is not the constraint.  ON TARGET: yes (the core agent, eval and gate), but with packaging and docs overbuilt around it.

REQUIREMENTS:
- Critic agent with a 0→5 ordered method and a fixed verdict grammar | source: "attached to the end of just about any turn", "audit/review tool" | physics? no, recommendation | keep
- Evaluate against real repos (jev-spike, pidgeon, kitctl) | source: "evaluate it against some actual repos" | recorded owner decision | keep
- Advisory plus opt-in Stop hook | source: owner decision "Advisory + opt-in Stop hook" | physics (recorded decision) | keep
- Support all four harnesses "like primitives" | source: owner decision | recorded owner decision, but its scope is ambiguous: "support" may mean the same prompt, not four manifests plus a duplicated body | question
- Standalone repo | source: owner decision | keep
- Sourced Musk canon (PRINCIPLES.md, 186 lines, with [V]/[P]/[U] provenance) | source: nobody. The request says "principles of how Elon Musk goes about solving a problem". It does not ask for a citation apparatus, and PRINCIPLES.md states that its own research never opened a primary source. | recommendation | delete or shrink
- Pre-registered gate with a hand audit and a blinded judge | source: nobody asked for it, but CLAUDE.md requires it ("re-run the gate") | repo rule, so evidence | keep
- Version identical across four manifests, and a prompt body duplicated into wiring/agents-md.md and held in sync by selftest | source: CLAUDE.md, which the work itself wrote | recommendation | simplify

CUTS:
1. STEP: delete
   TARGET: PRINCIPLES.md (186 lines), plus the README and CHANGELOG pointers to it (README.md:60, 72, 181)
   EVIDENCE: Nothing loads it. It says "the critic's prompt paraphrases this document; it does not quote it". The grep shows only README and CHANGELOG reference it. It is the largest non-test file and documents sources whose primary pages were never opened. The 92-line prompt is the only thing that affects behavior, and the eval measures that prompt. I found no ADR or incident that justifies it, so the evidence for keeping it is nobody. Git history shows it was added with the docs commit.
   REVERSIBLE: two-way
   IF WRONG: a prompt change cannot be traced to its motivating failure, or someone asks for the quote provenance. Restore a 20-line failure-mode table instead of the full canon.

2. STEP: delete
   TARGET: wiring/agents-md.md (109 lines) and the verbatim-sync selftest check, or replace them with a generated build artifact. Also drop the separate .plugin/plugin.json and .cursor-plugin/plugin.json, plus the "version identical in four plugin.json" rule, until one non-Claude user exists.
   EVIDENCE: CLAUDE.md:6-8 hold a second copy of the prompt and four version fields in sync with a test. meta.yaml carries more (58 lines) restating the contract that the prompt already holds. There is no consumer evidence for the non-Claude surfaces. The eval ran only `claude -p`, so the Cursor, Codex and generic-plugin paths are untested. That is a compatibility layer with no one verified on the other side.
   REVERSIBLE: two-way
   IF WRONG: a Codex or Cursor user files an issue. Regenerate the manifest from one template. Recheck the owner decision on "all four" first, since a prompt-portable AGENTS.md snippet may satisfy it.

3. STEP: delete
   TARGET: meta.yaml `contract:` block, which duplicates the prompt's refusals and verdict list
   EVIDENCE: meta.yaml:12-21 restate `verdict`, `max_findings`, `refuses` and `uncertainty_resolves_to`, all of which are already in agents/elonify-critic.md. Two sources of truth. It exists only to follow the agent-primitives convention.
   REVERSIBLE: two-way
   IF WRONG: agent-primitives tooling fails to load the bundle.

4. STEP: question
   TARGET: the 9-fixture live set and the blinded-judge machinery, relative to the v0.2 gate
   EVIDENCE: The live audits are judged by hand at k=1 with no ground truth, and they produced the highest-value output (the fronts, parallel-build and PLAN.md cuts). The blinded judge covered 24 reports to compare against one baseline. The baseline comparison gave a clear answer, so further judging machinery is unneeded. The v0.2 gate is 30 lines. The eval is 314 lines plus a 218-line selftest, both larger than the 92-line prompt they verify. Keep the verification (CLAUDE.md requires it). Ask whether the next iteration should be the paired live run on the owner's actual next turn, since the real question is whether the owner acts on the cuts, and none of the results say so. The jev-setup-advisor result also shows the scorer and the owner disagreeing about what the right cut is.
   REVERSIBLE: two-way
   IF WRONG: none.

5. STEP: reorder
   TARGET: the order of work before v0.2 ships
   EVIDENCE: v0.2 adds guardrails and a scorer exemption ("a delete whose target is a comment, a duplicate…does not count") after seeing the failures. The prompt that "passed" 3 of 4 criteria was then edited twice. The strict criterion 4 failure was a code-fence artifact, and the pre-registered bar changed after the results. The v0.2 gate must be the first thing a re-run is judged against, with nothing else changed. Do not add features, such as more harnesses, until a v0.2 run clears all four bars.
   REVERSIBLE: two-way
   IF WRONG: v0.2 clears the bars first time; the reorder cost nothing.

KEEP:
- agents/elonify-critic.md, skills/review/SKILL.md, the opt-in Stop hook with its selftest — the core deliverable and a recorded owner decision.
- tests/eval.mjs, fixtures and GATE.md files — the repo rule and the verification-insurance guardrail; the hand audit shows they caught real defects (two bogus removals, a fence-wrapped verdict).
- tests/runs/*/results.json and RESULTS.md — evidence that CLAUDE.md says numbers must come from.
- The "Verification is insurance" guardrail in the prompt — the audit found the critic cutting committed evidence receipts that jev-spike's AGENTS.md:13 requires.
- CI (14 lines) — cheap and runs the selftest.

ADD-BACK WATCH: Whether a prompt edit can still be explained after PRINCIPLES.md goes. Whether any non-Claude user installs Cursor or Codex. Whether agent-primitives tooling reads meta.yaml. Whether the owner acts on cuts in live audits.

VERDICT: CUT FIRST
