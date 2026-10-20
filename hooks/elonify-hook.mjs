#!/usr/bin/env node
/**
 * elonify-hook — opt-in Stop gate for the elonify critic.
 *
 * The critic is advisory by default: a CLAUDE.md rule says when to run it. This hook makes that
 * rule hard to skip on turns that matter. It is deterministic and never calls a model. It keeps
 * a small per-session state file fed by three events:
 *
 *   PostToolUse  (Write|Edit|MultiEdit|NotebookEdit|ExitPlanMode)  count edits and decisions
 *   SubagentStop (elonify-critic)                                  record the verdict, reset counts
 *   Stop                                                           decide whether the turn may end
 *
 * At Stop it blocks once (exit 2) when:
 *   - edits >= min_edits, or a plan was approved, and the critic has not run since; or
 *   - the critic's latest verdict is in block_on and nothing was edited after it.
 * A final message containing `elonify: skip — <reason>` or `elonify: override — <reason>`
 * releases the gate, so a human-legible reason is always the way out.
 *
 * Opt in per project with .claude/elonify.json:
 *
 *   { "min_edits": 5, "block_on": ["REFRAME", "CUT FIRST"] }
 *
 * No config means no opinion. Failure is deliberately asymmetric: a failing check blocks, a
 * failing hook (bad JSON, unreadable state) never does — a guard that bricks every turn gets
 * uninstalled, and then there is no guard at all.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VERDICTS = ["PROCEED", "CUT FIRST", "REFRAME"];
const DEFAULTS = { min_edits: 5, block_on: ["REFRAME", "CUT FIRST"] };
const EDIT_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
const RELEASE = /elonify:\s*(skip|override)\s*[—–:-]+\s*\S/i;

function readPayload() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

/** Returns the merged config, null when the project has not opted in. Throws on malformed config. */
export function loadConfig(root) {
  const path = join(root, ".claude", "elonify.json");
  if (!existsSync(path)) return null;
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(".claude/elonify.json must be a JSON object");
  }
  const config = { ...DEFAULTS, ...parsed };
  if (!Number.isInteger(config.min_edits) || config.min_edits < 1) {
    throw new Error("min_edits must be a positive integer");
  }
  if (!Array.isArray(config.block_on) || !config.block_on.every((v) => VERDICTS.includes(v))) {
    throw new Error(`block_on must be an array drawn from ${VERDICTS.join(", ")}`);
  }
  return config;
}

/** The last `VERDICT: <token>` line in a critic report, or null. */
export function parseVerdict(text) {
  if (typeof text !== "string") return null;
  const matches = [...text.matchAll(/^\s*\**VERDICT:?\**:?\s*\**\s*(PROCEED|CUT FIRST|REFRAME)\b/gm)];
  return matches.length ? matches[matches.length - 1][1] : null;
}

function statePath(sessionId) {
  const safe = String(sessionId || "default").replace(/[^A-Za-z0-9_-]/g, "_");
  return join(process.env.ELONIFY_STATE_DIR || join(tmpdir(), "elonify"), `${safe}.json`);
}

function readState(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { edits: 0, decisions: 0, verdict: null };
  }
}

function writeState(path, state) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(state));
}

/**
 * Pure decision for the Stop event. Returns null to let the turn end, or the reason to block.
 * Kept separate from I/O so every path is testable.
 */
export function decideStop(state, config, lastMessage) {
  if (RELEASE.test(lastMessage || "")) return null;
  const work = state.edits >= config.min_edits || state.decisions > 0;

  if (work && !state.verdict) {
    const what = state.decisions > 0 ? "a plan was approved" : `${state.edits} file edits`;
    return (
      `elonify: this turn made ${what} and the elonify critic has not reviewed it.\n\n` +
      `Run /elonify:review (or the elonify-critic subagent) on the plan or diff, passing the ` +
      `user's original request verbatim, then act on its verdict. If review is genuinely not ` +
      `warranted, end with "elonify: skip — <reason>".`
    );
  }
  if (state.verdict && config.block_on.includes(state.verdict) && state.edits === 0) {
    return (
      `elonify: the critic returned ${state.verdict} and nothing has changed since.\n\n` +
      (state.verdict === "REFRAME"
        ? `Put the reframing question to the user instead of continuing as planned.`
        : `Make the cuts it listed, or say for each why it stays.`) +
      ` To end anyway, state "elonify: override — <reason>".`
    );
  }
  return null;
}

function main() {
  const payload = readPayload();
  const root = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();

  let config;
  try {
    config = loadConfig(root);
  } catch (err) {
    if (payload.hook_event_name === "Stop") {
      console.error(`elonify: ignoring .claude/elonify.json — ${err.message}`);
    }
    process.exit(0);
  }
  if (!config) process.exit(0);

  const path = statePath(payload.session_id);
  const state = readState(path);

  try {
    switch (payload.hook_event_name) {
      case "PostToolUse":
        if (EDIT_TOOLS.has(payload.tool_name)) state.edits += 1;
        else if (payload.tool_name === "ExitPlanMode") state.decisions += 1;
        writeState(path, state);
        process.exit(0);

      case "SubagentStop": {
        const verdict = parseVerdict(payload.last_assistant_message);
        if (verdict) writeState(path, { edits: 0, decisions: 0, verdict });
        process.exit(0);
      }

      case "Stop": {
        // Claude Code sets this when the turn is already continuing because of a Stop hook.
        // Blocking again could loop; one nudge per stop is the contract.
        const reason = payload.stop_hook_active
          ? null
          : decideStop(state, config, payload.last_assistant_message);
        if (!reason) {
          rmSync(path, { force: true });
          process.exit(0);
        }
        console.error(reason);
        process.exit(2); // exit 2 blocks the stop and returns stderr to the agent
      }

      default:
        process.exit(0);
    }
  } catch (err) {
    console.error(`elonify: hook error, not blocking — ${err.message}`);
    process.exit(0);
  }
}

// Run only when executed as the hook, not when imported by the selftest.
if (process.argv[1]?.endsWith("elonify-hook.mjs")) main();
