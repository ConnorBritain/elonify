#!/usr/bin/env node
// Deterministic self-test: manifests, prompt/wiring parity, verdict grammar, and every hook path.
// No dependencies. Run: node tests/selftest.mjs

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decideStop, parseVerdict } from "../hooks/elonify-hook.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
let failures = 0;
let passes = 0;

function check(name, cond, detail = "") {
  if (cond) passes += 1;
  else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ── manifests ────────────────────────────────────────────────────────────────
const manifests = [
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".codex-plugin/plugin.json",
  ".plugin/plugin.json",
];
const parsed = {};
for (const m of [...manifests, ".claude-plugin/marketplace.json", "hooks/hooks.json"]) {
  try {
    parsed[m] = JSON.parse(read(m));
    check(`${m} parses`, true);
  } catch (err) {
    check(`${m} parses`, false, err.message);
  }
}
const versions = manifests.map((m) => parsed[m]?.version);
versions.push(parsed[".claude-plugin/marketplace.json"]?.plugins?.[0]?.version);
check("version identical across all manifests", new Set(versions).size === 1, versions.join(", "));
check("every manifest is named elonify", manifests.every((m) => parsed[m]?.name === "elonify"));
for (const p of parsed[".claude-plugin/plugin.json"]?.agents ?? []) {
  check(`declared agent ${p} exists`, existsSync(join(ROOT, p)));
}
check("codex manifest has interface block", !!parsed[".codex-plugin/plugin.json"]?.interface?.displayName);

// ── agent frontmatter + meta.yaml + wiring parity ────────────────────────────
const agent = read("agents/elonify-critic.md");
const fm = agent.match(/^---\n([\s\S]*?)\n---\n/);
check("agent has frontmatter", !!fm);
const keys = Object.fromEntries(
  (fm?.[1] ?? "").split("\n").map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()]),
);
for (const k of ["name", "description", "tools", "model", "color"]) check(`agent frontmatter has ${k}`, !!keys[k]);
check("agent name is elonify-critic", keys.name === "elonify-critic");
check("agent tools are read-only", !/\b(Write|Edit|MultiEdit|NotebookEdit)\b/.test(keys.tools ?? ""));
check("description names the siblings it is not", /architecture-reviewer/.test(keys.description) && /verification-critic/.test(keys.description));

const body = agent.slice(fm?.[0].length ?? 0).replace(/^\n/, "").trimEnd();
check("wiring/agents-md.md carries the agent body verbatim", read("wiring/agents-md.md").includes(body));

const meta = read("meta.yaml");
check("meta.yaml names the agent", /^name: elonify-critic$/m.test(meta));
check("meta.yaml verdict tokens match prompt", /verdict: \[PROCEED, CUT FIRST, REFRAME\]/.test(meta));
for (const v of ["PROCEED", "CUT FIRST", "REFRAME"]) check(`prompt defines ${v}`, body.includes(`\`${v}\``));
check("prompt ends output contract on VERDICT line", /The last line must be exactly `VERDICT: `/.test(body));
check("skill exists", existsSync(join(ROOT, "skills/review/SKILL.md")));

// ── verdict parser ───────────────────────────────────────────────────────────
check("parse PROCEED", parseVerdict("CUTS:\nnone\nVERDICT: PROCEED") === "PROCEED");
check("parse CUT FIRST", parseVerdict("...\nVERDICT: CUT FIRST\n") === "CUT FIRST");
check("parse bold markdown", parseVerdict("**VERDICT:** REFRAME") === "REFRAME");
check("parse takes the last verdict", parseVerdict("VERDICT: PROCEED\nlater\nVERDICT: CUT FIRST") === "CUT FIRST");
check("parse rejects unknown token", parseVerdict("VERDICT: SHIP") === null);
check("parse rejects prose mention", parseVerdict("the verdict was proceed") === null);
check("parse tolerates non-string", parseVerdict(undefined) === null);

// ── pure Stop decision ───────────────────────────────────────────────────────
const cfg = { min_edits: 5, block_on: ["REFRAME", "CUT FIRST"] };
const st = (o) => ({ edits: 0, decisions: 0, verdict: null, ...o });
check("decide: quiet turn ends", decideStop(st({ edits: 2 }), cfg, "") === null);
check("decide: big turn without critic blocks", /has not reviewed/.test(decideStop(st({ edits: 5 }), cfg, "") ?? ""));
check("decide: approved plan without critic blocks", /plan was approved/.test(decideStop(st({ decisions: 1 }), cfg, "") ?? ""));
check("decide: PROCEED ends", decideStop(st({ verdict: "PROCEED" }), cfg, "") === null);
check("decide: CUT FIRST untouched blocks", /CUT FIRST/.test(decideStop(st({ verdict: "CUT FIRST" }), cfg, "") ?? ""));
check("decide: REFRAME untouched asks user", /reframing question/.test(decideStop(st({ verdict: "REFRAME" }), cfg, "") ?? ""));
check("decide: CUT FIRST then edits ends", decideStop(st({ verdict: "CUT FIRST", edits: 1 }), cfg, "") === null);
check("decide: verdict outside block_on ends", decideStop(st({ verdict: "CUT FIRST" }), { ...cfg, block_on: ["REFRAME"] }, "") === null);
check("decide: skip with reason releases", decideStop(st({ edits: 9 }), cfg, "Done.\nelonify: skip — docs-only change") === null);
check("decide: override with reason releases", decideStop(st({ verdict: "REFRAME" }), cfg, "elonify: override - owner already decided") === null);
check("decide: bare skip without reason does not release", decideStop(st({ edits: 9 }), cfg, "elonify: skip") !== null);

// ── hook process, end to end ─────────────────────────────────────────────────
const HOOK = join(ROOT, "hooks/elonify-hook.mjs");
const stateDir = mkdtempSync(join(tmpdir(), "elonify-state-"));
function project(config) {
  const dir = mkdtempSync(join(tmpdir(), "elonify-proj-"));
  if (config !== undefined) {
    mkdirSync(join(dir, ".claude"));
    writeFileSync(join(dir, ".claude/elonify.json"), typeof config === "string" ? config : JSON.stringify(config));
  }
  return dir;
}
let sid = 0;
function run(dir, payload, session) {
  const r = spawnSync("node", [HOOK], {
    input: typeof payload === "string" ? payload : JSON.stringify({ session_id: session, ...payload }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir, ELONIFY_STATE_DIR: stateDir },
    encoding: "utf8",
  });
  return { code: r.status, err: r.stderr };
}
const edit = { hook_event_name: "PostToolUse", tool_name: "Edit" };
const stop = (extra = {}) => ({ hook_event_name: "Stop", stop_hook_active: false, last_assistant_message: "done", ...extra });
const critic = (verdict) => ({ hook_event_name: "SubagentStop", agent_type: "elonify:elonify-critic", last_assistant_message: `CUTS:\nnone\nVERDICT: ${verdict}` });

{
  const s = `s${++sid}`;
  const dir = project(undefined);
  for (let i = 0; i < 9; i++) run(dir, edit, s);
  check("hook: no config, no opinion", run(dir, stop(), s).code === 0);
  check("hook: no config writes no state", !readdirSync(stateDir).includes(`${s}.json`));
}
{
  const s = `s${++sid}`;
  const r = run(project("{not json"), stop(), s);
  check("hook: malformed config does not block", r.code === 0);
  check("hook: malformed config warns", /ignoring/.test(r.err));
}
{
  const s = `s${++sid}`;
  check("hook: invalid min_edits does not block", run(project({ min_edits: 0 }), stop(), s).code === 0);
}
{
  const s = `s${++sid}`;
  check("hook: unreadable stdin does not block", run(project({}), "garbage", s).code === 0);
}
{
  const s = `s${++sid}`;
  const dir = project({ min_edits: 3 });
  run(dir, edit, s);
  run(dir, edit, s);
  check("hook: under threshold ends", run(dir, stop(), s).code === 0);
}
{
  const s = `s${++sid}`;
  const dir = project({ min_edits: 3 });
  for (let i = 0; i < 3; i++) run(dir, edit, s);
  const r = run(dir, stop(), s);
  check("hook: unreviewed big turn blocks", r.code === 2 && /has not reviewed/.test(r.err), r.err);
  check("hook: loop guard releases", run(dir, stop({ stop_hook_active: true }), s).code === 0);
  check("hook: allowed stop clears state", !readdirSync(stateDir).includes(`${s}.json`));
}
{
  const s = `s${++sid}`;
  const dir = project({});
  run(dir, { hook_event_name: "PostToolUse", tool_name: "ExitPlanMode" }, s);
  check("hook: approved plan without review blocks", run(dir, stop(), s).code === 2);
}
{
  const s = `s${++sid}`;
  const dir = project({ min_edits: 2 });
  run(dir, edit, s);
  run(dir, edit, s);
  run(dir, critic("PROCEED"), s);
  check("hook: PROCEED ends turn", run(dir, stop(), s).code === 0);
}
{
  const s = `s${++sid}`;
  const dir = project({ min_edits: 2 });
  run(dir, edit, s);
  run(dir, edit, s);
  run(dir, critic("CUT FIRST"), s);
  check("hook: unaddressed CUT FIRST blocks", run(dir, stop(), s).code === 2);
  run(dir, critic("CUT FIRST"), s);
  run(dir, edit, s);
  check("hook: CUT FIRST then edit ends", run(dir, stop(), s).code === 0);
}
{
  const s = `s${++sid}`;
  const dir = project({});
  run(dir, critic("REFRAME"), s);
  check("hook: override releases REFRAME", run(dir, stop({ last_assistant_message: "elonify: override — user confirmed scope" }), s).code === 0);
}
{
  const s = `s${++sid}`;
  const dir = project({ min_edits: 1 });
  run(dir, edit, s);
  run(dir, { hook_event_name: "SubagentStop", last_assistant_message: "no verdict here" }, s);
  check("hook: critic output without verdict does not count as review", run(dir, stop(), s).code === 2);
}
{
  const s = `s${++sid}`;
  const dir = project({ min_edits: 1 });
  run(dir, { hook_event_name: "PostToolUse", tool_name: "Read" }, s);
  check("hook: non-edit tools are not counted", run(dir, stop(), s).code === 0);
}

// ── eval fixtures integrity ──────────────────────────────────────────────────
const fx = JSON.parse(read("tests/fixtures/fixtures.json"));
const names = new Set();
for (const f of fx.fixtures) {
  check(`fixture ${f.name} has unique name`, !names.has(f.name));
  names.add(f.name);
  check(`fixture ${f.name} kind`, ["positive", "guardrail", "clean", "live"].includes(f.kind), f.kind);
  check(`fixture ${f.name} mode`, ["plan", "diff", "path"].includes(f.mode), f.mode);
  check(`fixture ${f.name} names a repo and a target`, !!f.repo && !!f.target);
  check(`fixture ${f.name} has a verbatim request`, typeof f.request === "string" && f.request.length > 0);
  if (f.kind === "positive") check(`fixture ${f.name} lists what must be cut`, Array.isArray(f.expect?.cut_mentions) && f.expect.cut_mentions.length > 0);
  if (f.kind === "guardrail") check(`fixture ${f.name} lists what must not be cut`, Array.isArray(f.expect?.must_not_cut) && f.expect.must_not_cut.length > 0);
  if (f.expect?.verdict) check(`fixture ${f.name} verdict token`, ["PROCEED", "CUT FIRST", "REFRAME", "CUT FIRST|REFRAME"].includes(f.expect.verdict));
}

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
