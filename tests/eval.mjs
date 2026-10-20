#!/usr/bin/env node
// Eval harness for elonify-critic against real repositories.
//
//   node tests/eval.mjs prepare  <run-id> [--only a,b]
//   node tests/eval.mjs dispatch <run-id> [--k 3] [--model sonnet] [--critic elonify|arch] [--jobs 4]
//   node tests/eval.mjs collect  <run-id> [--critic elonify|arch]
//   node tests/eval.mjs cleanup  <run-id>          remove worktrees, keep transcripts
//
// Inputs are materialized, never vendored: each fixture names a repo, a commit to check out, and a
// target (plan file, git range, or path). `prepare` builds a detached worktree per fixture under
// tests/.cache/<run-id>/ (gitignored). Repos marked private in fixtures.json contribute only
// verdicts and scores to the committed results — never code, paths, or critic prose.
//
// Repo locations come from ELONIFY_EVAL_REPOS (JSON {name: path}) or fixtures.json `repos`, with
// `~` expanded. Dispatch runs `claude -p` as the critic agent inside the worktree, with project
// settings excluded so the target repo's own hooks don't fire, while its CLAUDE.md still loads
// (the critic sees the same instructions a real review would).

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseVerdict } from "../hooks/elonify-hook.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = JSON.parse(readFileSync(join(ROOT, "tests/fixtures/fixtures.json"), "utf8"));
const CACHE = join(ROOT, "tests/.cache");
const RUNS = join(ROOT, "tests/runs");

const CRITICS = {
  elonify: {
    agent: "elonify:elonify-critic",
    pluginDir: ROOT,
    promptFile: join(ROOT, "agents/elonify-critic.md"),
  },
  arch: {
    agent: "verification-gate:architecture-reviewer",
    pluginDir: process.env.ELONIFY_ARCH_PLUGIN || "/home/user/connorbritain/agent-primitives/bundles/verification-gate",
    promptFile: null,
  },
};
const READ_ONLY_TOOLS = ["Read", "Grep", "Glob", "Bash(git diff:*)", "Bash(git log:*)", "Bash(git show:*)", "Bash(git status:*)", "Bash(git ls-files:*)"];

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? true : argv[++i];
    else out._.push(argv[i]);
  }
  return out;
}

const expand = (p) => (p.startsWith("~") ? join(homedir(), p.slice(1)) : p);
function repoPath(name) {
  const override = process.env.ELONIFY_EVAL_REPOS ? JSON.parse(process.env.ELONIFY_EVAL_REPOS) : {};
  const spec = override[name] ?? FIXTURES.repos[name]?.path;
  if (!spec) throw new Error(`no path for repo ${name}`);
  return expand(spec);
}
const isPrivate = (name) => !!FIXTURES.repos[name]?.private;
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const git = (cwd, ...a) => spawnSync("git", a, { cwd, encoding: "utf8" });

function selected(opts) {
  const only = typeof opts.only === "string" ? new Set(opts.only.split(",")) : null;
  return FIXTURES.fixtures.filter((f) => !only || only.has(f.name));
}

function promptFor(f) {
  const lines = ["ORIGINAL REQUEST (verbatim):", f.request, "", "TARGET:", f.target];
  if (f.altitude) lines.push("", `ALTITUDE: ${f.altitude}`);
  return lines.join("\n") + "\n";
}

// ── prepare ──────────────────────────────────────────────────────────────────
function prepare(runId, opts) {
  const runDir = join(CACHE, runId);
  mkdirSync(runDir, { recursive: true });
  const manifest = { run_id: runId, prepared: new Date().toISOString(), cases: [] };
  for (const f of selected(opts)) {
    const src = repoPath(f.repo);
    const wt = join(runDir, f.name, "repo");
    if (!existsSync(wt)) {
      if (git(src, "cat-file", "-e", `${f.checkout}^{commit}`).status !== 0) {
        const fetched = git(src, "fetch", "--depth=200", "origin", f.checkout);
        if (fetched.status !== 0) throw new Error(`${f.name}: cannot fetch ${f.checkout}: ${fetched.stderr ?? fetched.error?.message}`);
      }
      mkdirSync(join(runDir, f.name), { recursive: true });
      const added = git(src, "worktree", "add", "--detach", wt, f.checkout);
      if (added.status !== 0) throw new Error(`${f.name}: worktree failed: ${added.stderr}`);
    }
    const prompt = promptFor(f);
    writeFileSync(join(runDir, f.name, "prompt.md"), prompt);
    manifest.cases.push({ fixture: f.name, repo: f.repo, checkout: f.checkout, prompt_sha256: sha256(prompt) });
  }
  writeFileSync(join(runDir, "MANIFEST.json"), JSON.stringify(manifest, null, 2));
  console.log(`prepared ${manifest.cases.length} case(s) in ${runDir}`);
}

// ── dispatch ─────────────────────────────────────────────────────────────────
function runOne(f, runDir, critic, model, draw) {
  const caseDir = join(runDir, f.name);
  const out = join(caseDir, `${critic}-${model}-d${draw}.md`);
  if (existsSync(out)) return Promise.resolve({ f, draw, skipped: true });
  const c = CRITICS[critic];
  const argv = [
    "-p", readFileSync(join(caseDir, "prompt.md"), "utf8"),
    "--plugin-dir", c.pluginDir,
    "--agent", c.agent,
    "--model", model,
    "--setting-sources", "user",
    "--allowedTools", ...READ_ONLY_TOOLS,
    "--no-session-persistence",
    "--max-budget-usd", process.env.ELONIFY_EVAL_BUDGET || "4",
  ];
  return new Promise((done) => {
    const started = Date.now();
    const child = spawn("claude", argv, { cwd: join(caseDir, "repo"), stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), 20 * 60 * 1000);
    child.on("close", (code) => {
      clearTimeout(timer);
      const secs = Math.round((Date.now() - started) / 1000);
      if (code === 0 && stdout.trim()) writeFileSync(out, stdout);
      else writeFileSync(`${out}.err`, `exit ${code} after ${secs}s\n${stderr}\n${stdout}`);
      done({ f, draw, code, secs });
    });
  });
}

async function dispatch(runId, opts) {
  const runDir = join(CACHE, runId);
  const k = Number(opts.k || 3);
  const model = opts.model || "sonnet";
  const critic = opts.critic || "elonify";
  const jobs = Number(opts.jobs || 4);
  const queue = [];
  for (const f of selected(opts)) {
    if (critic === "arch" && f.mode !== "diff") continue;
    const draws = f.kind === "live" ? Math.min(k, Number(opts["live-k"] || 1)) : k;
    for (let d = 1; d <= draws; d++) queue.push([f, d]);
  }
  let active = 0;
  let finished = 0;
  await new Promise((allDone) => {
    const next = () => {
      if (!queue.length && !active) return allDone();
      while (active < jobs && queue.length) {
        const [f, d] = queue.shift();
        active += 1;
        runOne(f, runDir, critic, model, d).then((r) => {
          active -= 1;
          finished += 1;
          console.log(`${r.skipped ? "skip" : r.code === 0 ? "ok  " : "FAIL"} ${f.name} d${d}${r.secs ? ` ${r.secs}s` : ""} (${finished} done, ${queue.length} queued)`);
          next();
        });
      }
    };
    next();
  });
}

// ── collect ──────────────────────────────────────────────────────────────────
/** Split the CUTS section into items with step and target. */
function parseCuts(text) {
  const m = text.match(/^\s*\**CUTS:?\**:?\s*\n([\s\S]*?)(?=^\s*\**(KEEP|ADD-BACK WATCH|VERDICT)\b)/m);
  if (!m || /^\s*none\b/i.test(m[1])) return [];
  return m[1]
    .split(/^\s*\d+[.)]\s+/m)
    .filter((s) => s.trim())
    .map((s) => ({
      step: (s.match(/STEP:\**\s*([a-z]+)/i)?.[1] || "").toLowerCase(),
      target: s.match(/TARGET:\**\s*(.+)/i)?.[1]?.trim() || "",
      text: s,
    }));
}

function grammarOk(text) {
  const last = text.trim().split("\n").pop().trim();
  return /^VERDICT: (PROCEED|CUT FIRST|REFRAME)$/.test(last);
}

function scoreDraw(f, text) {
  const verdict = parseVerdict(text);
  const cuts = parseCuts(text);
  const e = f.expect || {};
  const any = (patterns, s) => patterns.some((p) => new RegExp(p, "i").test(s));
  const r = { verdict, grammar: grammarOk(text), cuts: cuts.length };
  if (e.verdict) r.verdict_ok = e.verdict.split("|").includes(verdict);
  if (e.cut_mentions) r.cut_hit = cuts.some((c) => any(e.cut_mentions, c.text));
  if (e.must_not_cut) {
    r.guardrail_violations = cuts.filter(
      // Consolidating or questioning a guard is not removing it; only a delete counts.
      (c) => c.step === "delete" && any(e.must_not_cut, c.target),
    ).length;
  }
  if (e.max_cuts !== undefined) r.within_cut_budget = cuts.length <= e.max_cuts;
  r.targets = cuts.map((c) => `${c.step}: ${c.target}`);
  return r;
}

const majority = (vals) => vals.filter(Boolean).length * 2 > vals.length;

function collect(runId, opts) {
  const runDir = join(CACHE, runId);
  const critic = opts.critic || "elonify";
  const results = [];
  for (const f of FIXTURES.fixtures) {
    const caseDir = join(runDir, f.name);
    if (!existsSync(caseDir)) continue;
    const files = readdirSync(caseDir).filter((n) => n.startsWith(`${critic}-`) && n.endsWith(".md"));
    if (!files.length) continue;
    const byModel = {};
    for (const file of files.sort()) {
      const model = file.split("-")[1];
      (byModel[model] ??= []).push(scoreDraw(f, readFileSync(join(caseDir, file), "utf8")));
    }
    for (const [model, draws] of Object.entries(byModel)) {
      const summary = { fixture: f.name, kind: f.kind, repo: f.repo, altitude: f.altitude, model, draws: draws.length };
      summary.verdicts = draws.map((d) => d.verdict);
      summary.grammar = draws.every((d) => d.grammar);
      if (f.expect?.verdict) summary.verdict_ok = majority(draws.map((d) => d.verdict_ok));
      if (f.expect?.cut_mentions) summary.cut_hit = majority(draws.map((d) => d.cut_hit));
      if (f.expect?.must_not_cut) summary.guardrail_violations = draws.reduce((n, d) => n + d.guardrail_violations, 0);
      if (f.expect?.max_cuts !== undefined) summary.within_cut_budget = majority(draws.map((d) => d.within_cut_budget));
      if (!isPrivate(f.repo)) summary.targets = draws.map((d) => d.targets);
      results.push(summary);
    }
  }
  const out = join(RUNS, `${runId}-${critic}`);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "results.json"), JSON.stringify(results, null, 2) + "\n");

  const lines = [`# ${runId} · ${critic}`, "", "Generated by `node tests/eval.mjs collect`. Do not edit by hand.", ""];
  for (const model of [...new Set(results.map((r) => r.model))]) {
    const rs = results.filter((r) => r.model === model);
    const pos = rs.filter((r) => r.kind === "positive");
    const guard = rs.filter((r) => r.kind === "guardrail");
    const clean = rs.filter((r) => r.kind === "clean");
    lines.push(
      `## ${model}`,
      "",
      `- positives caught (majority CUT FIRST/REFRAME with the named cut): ${pos.filter((r) => r.verdict_ok && r.cut_hit).length} / ${pos.length}`,
      `- positives with the named cut, any verdict: ${pos.filter((r) => r.cut_hit).length} / ${pos.length}`,
      `- guardrail violations (all draws): ${guard.reduce((n, r) => n + r.guardrail_violations, 0)}`,
      `- clean negatives PROCEED by majority: ${clean.filter((r) => r.verdict_ok).length} / ${clean.length}`,
      `- verdict grammar: ${rs.filter((r) => r.grammar).length} / ${rs.length} fixtures, every draw`,
      "",
      "| fixture | kind | altitude | verdicts | expected verdict | named cut | guardrail violations |",
      "|---|---|---|---|---|---|---|",
      ...rs.map((r) =>
        `| ${r.fixture} | ${r.kind} | ${r.altitude ?? ""} | ${r.verdicts.join(", ")} | ${fmt(r.verdict_ok)} | ${fmt(r.cut_hit)} | ${r.guardrail_violations ?? ""} |`,
      ),
      "",
    );
  }
  writeFileSync(join(out, "RESULTS.md"), lines.join("\n"));
  console.log(lines.join("\n"));
}
function cleanup(runId) {
  const runDir = join(CACHE, runId);
  for (const f of FIXTURES.fixtures) {
    const wt = join(runDir, f.name, "repo");
    if (existsSync(wt)) git(repoPath(f.repo), "worktree", "remove", "--force", wt);
  }
  for (const name of Object.keys(FIXTURES.repos)) git(repoPath(name), "worktree", "prune");
  console.log(`removed worktrees under ${runDir}`);
}
const fmt = (v) => (v === undefined ? "" : v ? "yes" : "no");

const opts = args(process.argv.slice(2));
const [cmd, runId] = opts._;
if (!runId || !["prepare", "dispatch", "collect", "cleanup"].includes(cmd)) {
  console.error("usage: node tests/eval.mjs prepare|dispatch|collect|cleanup <run-id> [options]");
  process.exit(64);
}
if (cmd === "prepare") prepare(runId, opts);
if (cmd === "dispatch") await dispatch(runId, opts);
if (cmd === "collect") collect(runId, opts);
if (cmd === "cleanup") cleanup(runId);
