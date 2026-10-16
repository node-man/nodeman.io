#!/usr/bin/env node
// Tech Radar gate. Runs before every build (CI) and before every push (daily routine).
// Fails on: malformed data, numbers that do not match the raw collection, stale
// sources, excluded topics, missing conflict-of-interest handling, meta copy.
//
// Usage: node scripts/radar/validate.mjs            # all issues + ledger
//        node scripts/radar/validate.mjs 2026-10-17 # one issue + ledger

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DIR = path.join(ROOT, "content/radar");
const MAX_RAW_AGE_H = 3; // publishedAt - raw.collectedAt
const MIN_OK_FEEDS = 4;

// Never auto-published: named people's misconduct, criminal process, self-harm.
const BANNED = ["비위", "횡령", "배임", "성추행", "성폭행", "성희롱", "피의자", "구속영장", "체포", "자해", "자살", "극단적 선택", "마약", "음주운전", "self-harm", "suicide"];
// Allowed only when every named party is a company (story.legal === "company-only").
const LEGAL = ["소송", "피소", "고소", "기소", "혐의", "제소", "lawsuit", "sued", "indicted"];
// Copy that talks about the publication itself instead of the news.
const META = ["샘플", "처음 만든", "Nodeman 편집", "편집자의 말", "이번 호부터"];
const SELF = /anthropic|앤트로픽|claude|클로드/i;
const RIVALS = /microsoft|마이크로소프트|openai|오픈ai|chatgpt|gpt-|google|구글|gemini|제미나이|\bmeta\b|메타(?!데이터)|muse|xai|grok|deepseek|딥시크|mistral/i;

const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
function isUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
function host(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "").replace(/^m\./, "");
  } catch {
    return "";
  }
}
function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (isObj(v)) Object.entries(v).forEach(([k, x]) => k !== "url" && strings(x, out));
  return out;
}
const kstDay = (isoStr) => new Date(new Date(isoStr).getTime() + 9 * 3600e3).toISOString().slice(0, 10);

function checkBlock(b, where, ctx) {
  if (!isObj(b) || !isStr(b.type)) return err(where, "block without type");
  const need = (cond, msg) => cond || err(`${where}[${b.type}]`, msg);
  switch (b.type) {
    case "p":
    case "pull":
      need(isStr(b.text), "text required");
      break;
    case "stats":
      need(Array.isArray(b.items) && b.items.length >= 2 && b.items.every((i) => isStr(i.value) && isStr(i.label)), "2+ items {value,label}");
      break;
    case "cards":
      need(Array.isArray(b.items) && b.items.length >= 2 && b.items.every((i) => isStr(i.name)), "2+ items with name");
      for (const i of b.items || []) if (i.dots) need(isNum(i.dots.on) && isNum(i.dots.total) && i.dots.on <= i.dots.total && i.dots.total <= 20, "dots on<=total<=20");
      break;
    case "timeline":
      need(isStr(b.title) && Array.isArray(b.points) && b.points.length >= 2, "title + 2+ points");
      for (const p of b.points || []) need(/^\d{4}(-\d{2}(-\d{2})?)?$/.test(p.date) && isStr(p.label), `point date/label invalid: ${p.date}`);
      break;
    case "bars":
      need(isStr(b.title) && Array.isArray(b.items) && b.items.length >= 2 && b.items.every((i) => isStr(i.label) && isNum(i.value) && i.value >= 0), "title + 2+ numeric items");
      break;
    case "share":
      need(isStr(b.title) && Array.isArray(b.items) && b.items.length >= 2 && b.items.every((i) => isStr(i.label) && isNum(i.value) && i.value > 0), "title + 2+ positive items");
      break;
    case "quotes":
      need(Array.isArray(b.items) && b.items.every((i) => isStr(i.who) && isStr(i.text)), "items {who,text}");
      break;
    case "unknowns":
      need(isStr(b.title) && Array.isArray(b.items) && b.items.every(isStr), "title + string items");
      break;
    case "list":
      need(Array.isArray(b.items) && b.items.every((i) => isStr(i.k) && isStr(i.text)), "items {k,text}");
      break;
    case "boxes":
      need(Array.isArray(b.items) && b.items.every((i) => ["go", "risk"].includes(i.tone) && isStr(i.title) && Array.isArray(i.items)), "items {tone,title,items}");
      break;
    case "reads":
      need(Array.isArray(b.items) && b.items.length >= 3, "3+ items");
      for (const r of b.items || []) {
        need(isStr(r.title) && isUrl(r.url) && isStr(r.via) && isStr(r.why), `read item incomplete: ${r.title}`);
        if (r.hn) {
          const h = ctx.raw?.hn?.items?.find((x) => String(x.id) === String(r.hn.id));
          if (!h) err(where, `HN item ${r.hn.id} not in raw collection`);
          else if (h.points !== r.hn.points || h.comments !== r.hn.comments)
            err(where, `HN ${r.hn.id} numbers ${r.hn.points}/${r.hn.comments} != raw ${h.points}/${h.comments}`);
        }
      }
      break;
    case "repo": {
      const r = b.repo;
      if (!need(isObj(r), "repo object")) break;
      need(isStr(r.fullName) && isNum(r.rank) && isNum(r.stars) && isNum(r.starsToday), "fullName/rank/stars/starsToday");
      need(["try", "experiment", "watch", "reference", "none"].includes(r.verdict), "verdict enum");
      if (/^anthropics\//i.test(r.fullName || "") && r.verdict !== "none") err(where, `${r.fullName}: Anthropic repositories take verdict "none" (conflict of interest)`);
      need(isStr(r.def) && Array.isArray(r.rows) && r.rows.length >= 1, "def + rows");
      const raw = ctx.raw?.github;
      if (!raw) {
        err(where, "repo block but issue has no raw collection");
        break;
      }
      if (raw.status !== "ok") err(where, `raw GitHub collection status is "${raw.status}" (${(raw.checks || []).join("; ")})`);
      const m = raw.repos?.find((x) => x.fullName === r.fullName);
      if (!m) err(where, `${r.fullName} not in raw trending list`);
      else {
        const apiStars = m.api && isNum(m.api.stars) ? m.api.stars : null;
        if (m.rank !== r.rank) err(where, `${r.fullName} rank ${r.rank} != raw ${m.rank}`);
        if (m.starsToday !== r.starsToday) err(where, `${r.fullName} starsToday ${r.starsToday} != raw ${m.starsToday}`);
        if (r.stars !== (apiStars ?? m.stars)) err(where, `${r.fullName} stars ${r.stars} != raw ${apiStars ?? m.stars}`);
      }
      break;
    }
    case "ledger":
      break;
    default:
      err(where, `unknown block type "${b.type}"`);
  }
}

function checkIssue(file, prevIssue, ledger) {
  const where = path.relative(ROOT, file);
  let issue;
  try {
    issue = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return err(where, `invalid JSON: ${e.message}`);
  }
  const date = path.basename(file, ".json");
  if (issue.version !== 1) err(where, "version must be 1");
  if (issue.date !== date) err(where, `date ${issue.date} != filename`);
  if (!isStr(issue.publishedAt) || Number.isNaN(Date.parse(issue.publishedAt))) err(where, "publishedAt invalid");
  else if (kstDay(issue.publishedAt) !== date) err(where, `publishedAt ${issue.publishedAt} is not on ${date} KST`);
  if (!isStr(issue.title) || !isStr(issue.lede)) err(where, "title/lede required");
  if (!Array.isArray(issue.quick) || issue.quick.length < 3 || issue.quick.length > 6) err(where, "quick: 3-6 items");

  // Raw collection: freshness and source health.
  let raw = null;
  if (issue.raw) {
    const rp = path.join(ROOT, issue.raw);
    if (!fs.existsSync(rp)) {
      // Raw files are pruned after 14 days; older issues keep their recorded timestamps.
      const ageDays = (Date.now() - Date.parse(issue.publishedAt)) / 86400e3;
      if (ageDays < 13) err(where, `raw file missing: ${issue.raw}`);
    } else {
      raw = JSON.parse(fs.readFileSync(rp, "utf8"));
      if (raw.collectedAt !== issue.rawCollectedAt) err(where, `rawCollectedAt ${issue.rawCollectedAt} != raw ${raw.collectedAt}`);
      const gapH = (Date.parse(issue.publishedAt) - Date.parse(raw.collectedAt)) / 3600e3;
      if (gapH < -0.25 || gapH > MAX_RAW_AGE_H) err(where, `raw collected ${gapH.toFixed(1)}h before publishing (allowed 0-${MAX_RAW_AGE_H}h)`);
      const okFeeds = (raw.feeds || []).filter((f) => f.status === "ok").length + (raw.hn?.status === "ok" ? 1 : 0);
      if (okFeeds < MIN_OK_FEEDS) err(where, `only ${okFeeds} fresh sources in raw collection (need ${MIN_OK_FEEDS})`);
    }
  } else if (issue.sections?.some((s) => s.kind === "github")) {
    err(where, "github section requires a raw collection");
  }

  const ctx = { raw };
  const ids = new Set();
  const prevTitles = new Set((prevIssue?.sections || []).flatMap((s) => s.stories.map((x) => x.title)));
  for (const [si, s] of (issue.sections || []).entries()) {
    const sw = `${where} sections[${si}:${s.id}]`;
    if (!["lead", "headlines", "github", "korea", "reading", "column"].includes(s.kind)) err(sw, `kind "${s.kind}" invalid`);
    if (!isStr(s.title) || !isStr(s.label) || !Array.isArray(s.stories) || !s.stories.length) err(sw, "label/title/stories required");
    for (const st of s.stories || []) {
      const w = `${sw} ${st.id}`;
      if (!isStr(st.id) || ids.has(st.id)) err(w, "story id missing or duplicated");
      ids.add(st.id);
      if (!isStr(st.title) || !Array.isArray(st.blocks) || !st.blocks.length) err(w, "title/blocks required");
      (st.blocks || []).forEach((b, bi) => checkBlock(b, `${w} blocks[${bi}]`, ctx));

      // Sources
      const links = st.sources || [];
      if (!links.length && s.kind !== "column") err(w, "at least one source link");
      for (const l of links) if (!isStr(l.title) || !isUrl(l.url)) err(w, `bad source ${JSON.stringify(l)}`);
      const hosts = new Set(links.map((l) => host(l.url)));
      if (s.kind === "lead" && hosts.size < 3) err(w, `lead story needs 3+ distinct outlets, has ${hosts.size}`);
      if (s.kind === "headlines" && hosts.size < 2) err(w, `headline story needs 2+ distinct outlets, has ${hosts.size}`);

      // Content rules
      const all = strings({ t: st.title, k: st.kicker, b: st.blocks, a: st.ai }).join("\n");
      for (const term of BANNED) if (all.toLowerCase().includes(term.toLowerCase())) err(w, `excluded topic term "${term}" — drop this story`);
      if (LEGAL.some((t) => all.toLowerCase().includes(t.toLowerCase())) && st.legal !== "company-only")
        err(w, `legal term found; allowed only with legal:"company-only" when every named party is a company`);
      const head = `${st.title} ${st.kicker || ""}`;
      if (SELF.test(head) && st.ai && st.ai.kind !== "none") err(w, "Anthropic/Claude story must use ai.kind none (conflict of interest)");
      if (RIVALS.test(head) && st.ai?.kind === "opinion" && !st.ai.points.some((p) => p.k === "밝혀 둘 점"))
        err(w, 'opinion on a rival AI company needs a "밝혀 둘 점" disclosure point');
      if (st.ai) {
        if (st.ai.kind === "opinion") {
          if (!isStr(st.ai.stance) || ![1, 2, 3].includes(st.ai.confidence) || !Array.isArray(st.ai.points) || !st.ai.points.length) err(w, "ai opinion needs stance, confidence 1-3, points");
        } else if (st.ai.kind !== "none" || !isStr(st.ai.reason)) err(w, "ai.kind none needs reason");
      }
      if (prevTitles.has(st.title) && !st.followUp) err(w, "same title as previous issue; mark followUp or drop");
    }
  }

  const everything = strings(issue).join("\n");
  for (const m of META) if (everything.includes(m)) err(where, `meta copy "${m}" — write about the news, not the publication`);
  for (const term of BANNED) if (strings({ q: issue.quick, t: issue.title, l: issue.lede }).join("\n").includes(term)) err(where, `excluded term "${term}" in title/lede/quick`);

  // Ledger entries issued by this issue must exist.
  const issued = ledger.filter((p) => p.issued === date);
  if (issue.sections?.some((s) => s.stories.some((x) => x.blocks.some((b) => b.type === "ledger"))) && !ledger.length) err(where, "ledger block but ledger.json empty");
  if (issued.length > 3) warn(where, `${issued.length} predictions issued in one day (keep it to 3 or fewer)`);
  return issue;
}

function checkLedger(dates) {
  const file = path.join(DIR, "ledger.json");
  if (!fs.existsSync(file)) return [];
  let list;
  try {
    list = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    err("ledger.json", `invalid JSON: ${e.message}`);
    return [];
  }
  const ids = new Set();
  for (const p of list) {
    const w = `ledger.json ${p.id}`;
    if (!isStr(p.id) || ids.has(p.id)) err(w, "id missing or duplicated");
    ids.add(p.id);
    if (!dates.includes(p.issued)) err(w, `issued ${p.issued} is not an issue date`);
    if (!isStr(p.statement)) err(w, "statement required");
    if (!isNum(p.probability) || p.probability < 0.05 || p.probability > 0.95) err(w, "probability must be 0.05-0.95");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.due) || p.due < p.issued) err(w, "due must be YYYY-MM-DD on/after issued");
    if (!["pending", "hit", "miss", "void"].includes(p.status)) err(w, "status enum");
    if (p.status !== "pending" && (!isStr(p.resolvedOn) || !isStr(p.note) || !isUrl(p.evidence))) err(w, "resolved entries need resolvedOn, note, evidence url");
    for (const term of BANNED) if (p.statement.includes(term)) err(w, `excluded term "${term}"`);
  }
  return list;
}

const only = process.argv[2];
const files = fs.existsSync(path.join(DIR, "issues"))
  ? fs.readdirSync(path.join(DIR, "issues")).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
  : [];
const dates = files.map((f) => f.slice(0, 10));
const ledger = checkLedger(dates);
let prev = null;
for (const f of files) {
  const date = f.slice(0, 10);
  const full = path.join(DIR, "issues", f);
  if (!only || only === date) {
    const issue = checkIssue(full, prev, ledger);
    prev = issue || prev;
  } else {
    try {
      prev = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch {
      /* reported when validated */
    }
  }
}
if (only && !dates.includes(only)) err(only, "issue file not found");

for (const w of warns) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`radar: ${files.length} issue(s), ${ledger.length} prediction(s), ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
