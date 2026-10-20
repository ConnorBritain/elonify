# Changelog

All notable changes are recorded here, following [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — 2026-10-20

### Added

- `elonify-critic`: a read-only, clean-context reviewer. It applies Musk's algorithm in this
  order: the right problem and the limiting factor, then requirements traced to a named owner,
  then delete, simplify, accelerate and automate. It works on plans, diffs and surfaces, at
  code, UX and workflow altitude, and ends with `PROCEED`, `CUT FIRST` or `REFRAME`.
  - Guardrails: Chesterton's fence, physics is never cut unilaterally, reversibility,
    redundancy is not waste, direct controls stay direct, deleting is not moving.
- `/elonify:review` skill. It resolves the target, passes the original request verbatim, and
  runs the critic in a clean context.
- Opt-in Stop hook (`.claude/elonify.json`). It is deterministic and blocks once per stop on
  unreviewed work or an unaddressed `CUT FIRST` or `REFRAME`. The release phrases are
  `elonify: skip — <reason>` and `elonify: override — <reason>`.
- Packaging for Claude Code, Cursor, Codex and AGENTS.md harnesses, plus wiring snippets.
- `PRINCIPLES.md`: the sourced canon, with a provenance tag on every quote.
- `tests/selftest.mjs`: manifests, prompt/wiring parity, verdict grammar, and every hook path.
- `tests/eval.mjs` and fixtures against jev-spike, pidgeon and kitctl, with pre-registered
  gates. The prompt that ships is v0.3, the first to pass: positives 3/5, guardrail
  violations 0, clean 3/3, grammar 33/33.
- The review skill passes the user's later decisions verbatim alongside the original request.
