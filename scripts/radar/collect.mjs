#!/usr/bin/env node
// Tech Radar raw collector. Runs in GitHub Actions (unrestricted network).
// Fetches every source directly (no caches), records fetch time and the newest
// item time per source, and writes content/radar/raw/<KST date>.json.
// The daily writer (Claude) reads ONLY this file for GitHub/HN/feed data, so
// numbers in an issue can always be traced back to a timestamped fetch.
//
// Usage: node scripts/radar/collect.mjs [--date YYYY-MM-DD] [--out dir]
// Env:   GITHUB_TOKEN (optional, raises API limits for the repo cross-check)

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const RAW_DIR = path.join(ROOT, "content/radar/raw");
const KEEP_DAYS = 14;
const UA = "Mozilla/5.0 (compatible; nodeman-radar/1.0; +https://nodeman.io/radar/)";
const TIMEOUT_MS = 20000;
const README_LIMIT = 6000;

// Maximum allowed gap between fetch time and the newest item in a feed before
// the source is marked stale (hours). Busy feeds should never go quiet this long.
const FEEDS = [
  { id: "techmeme", name: "Techmeme", url: "https://www.techmeme.com/feed.xml", maxGapH: 8, lang: "en" },
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com/feed/", maxGapH: 8, lang: "en" },
  { id: "theverge", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", maxGapH: 8, lang: "en" },
  { id: "electrek", name: "Electrek", url: "https://electrek.co/feed/", maxGapH: 12, lang: "en" },
  { id: "gnews-us", name: "Google News Technology (US)", url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en", maxGapH: 4, lang: "en" },
  { id: "gnews-kr", name: "Google 뉴스 IT·과학 (KR)", url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ko&gl=KR&ceid=KR:ko", maxGapH: 4, lang: "ko" },
  { id: "geeknews", name: "GeekNews", url: "https://news.hada.io/rss/news", maxGapH: 12, lang: "ko" },
  { id: "etnews", name: "전자신문", url: "https://rss.etnews.com/Section901.xml", maxGapH: 8, lang: "ko" },
  { id: "bloter", name: "블로터", url: "https://www.bloter.net/rss/allArticle.xml", maxGapH: 12, lang: "ko" },
  { id: "digitaltoday", name: "디지털투데이", url: "https://www.digitaltoday.co.kr/rss/allArticle.xml", maxGapH: 12, lang: "ko" },
];

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
}

function kstDate(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
}

async function get(url, { accept, auth } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const headers = { "user-agent": UA, "cache-control": "no-cache", pragma: "no-cache" };
  if (accept) headers.accept = accept;
  if (auth && process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal, redirect: "follow" });
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      body,
      date: res.headers.get("date"),
      age: res.headers.get("age"),
      lastModified: res.headers.get("last-modified"),
    };
  } finally {
    clearTimeout(t);
  }
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
function decode(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z0-9#]+);/gi, (m, e) => ENT[e.toLowerCase()] ?? m);
}
function text(s = "") {
  return decode(decode(s).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function num(s) {
  if (s == null) return null;
  const n = Number(String(s).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function iso(s) {
  if (!s) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function hoursBetween(a, b) {
  return Math.round(((new Date(a) - new Date(b)) / 3600e3) * 10) / 10;
}

// ---------- RSS / Atom ----------
function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/g) || [];
  for (const b of blocks) {
    const pick = (tag) => {
      const m = b.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1] : null;
    };
    let link = pick("link");
    if (!link || !link.trim()) {
      const m = b.match(/<link[^>]*href="([^"]+)"/);
      link = m ? m[1] : null;
    }
    const srcTag = b.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    items.push({
      title: text(pick("title") || ""),
      link: decode((link || "").trim()),
      publishedAt: iso(pick("pubDate") || pick("published") || pick("updated") || pick("dc:date")),
      outlet: srcTag ? text(srcTag[1]) : null,
    });
  }
  return items.filter((i) => i.title && i.link);
}

async function collectFeed(f, fetchedAt) {
  try {
    const r = await get(f.url, { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" });
    if (!r.ok) return { ...f, status: "failed", error: `HTTP ${r.status}`, items: [] };
    const items = parseFeed(r.body).slice(0, 60);
    const newest = items.map((i) => i.publishedAt).filter(Boolean).sort().at(-1) || null;
    const gapH = newest ? hoursBetween(fetchedAt, newest) : null;
    const status = !items.length ? "failed" : newest && gapH <= f.maxGapH ? "ok" : "stale";
    return { ...f, status, fetchedAt, httpDate: r.date, cacheAge: r.age, newestItemAt: newest, gapHours: gapH, count: items.length, items };
  } catch (e) {
    return { ...f, status: "failed", error: String(e.message || e), items: [] };
  }
}

// ---------- Hacker News (Algolia, live front page) ----------
async function collectHN(fetchedAt) {
  const url = "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=40";
  try {
    const r = await get(url, { accept: "application/json" });
    if (!r.ok) return { id: "hn", status: "failed", error: `HTTP ${r.status}`, items: [] };
    const hits = JSON.parse(r.body).hits || [];
    const items = hits
      .map((h) => ({
        id: h.objectID,
        title: h.title,
        link: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        points: h.points,
        comments: h.num_comments,
        publishedAt: h.created_at,
      }))
      .sort((a, b) => b.points - a.points);
    const newest = items.map((i) => i.publishedAt).sort().at(-1) || null;
    const gapH = newest ? hoursBetween(fetchedAt, newest) : null;
    return { id: "hn", name: "Hacker News front page", url, status: newest && gapH <= 6 ? "ok" : "stale", fetchedAt, newestItemAt: newest, gapHours: gapH, count: items.length, items };
  } catch (e) {
    return { id: "hn", status: "failed", error: String(e.message || e), items: [] };
  }
}

// ---------- GitHub trending + API cross-check ----------
function parseTrending(html) {
  const out = [];
  const blocks = html.split(/<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>/).slice(1);
  for (const b of blocks) {
    const href = b.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="\/([^"/]+\/[^"/]+)"/);
    if (!href) continue;
    const full = href[1];
    const esc = full.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stars = b.match(new RegExp(`href="\\/${esc}\\/stargazers"[^>]*>[\\s\\S]*?<\\/svg>\\s*([\\d,]+)`));
    const forks = b.match(new RegExp(`href="\\/${esc}\\/forks"[^>]*>[\\s\\S]*?<\\/svg>\\s*([\\d,]+)`));
    const today = b.match(/([\d,]+)\s+stars?\s+today/);
    const lang = b.match(/itemprop="programmingLanguage">([^<]+)</);
    const desc = b.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    out.push({
      rank: out.length + 1,
      fullName: full,
      url: `https://github.com/${full}`,
      description: desc ? text(desc[1]) : "",
      language: lang ? text(lang[1]) : null,
      stars: num(stars?.[1]),
      forks: num(forks?.[1]),
      starsToday: num(today?.[1]),
    });
  }
  return out;
}

async function collectGitHub(fetchedAt, prev) {
  const url = "https://github.com/trending?since=daily";
  const r = await get(url, { accept: "text/html" });
  if (!r.ok) return { id: "github", status: "failed", error: `HTTP ${r.status}`, repos: [] };
  const repos = parseTrending(r.body);
  const checks = [];
  if (repos.length < 5) checks.push(`parsed only ${repos.length} repositories`);

  for (const repo of repos.slice(0, 12)) {
    try {
      const a = await get(`https://api.github.com/repos/${repo.fullName}`, { accept: "application/vnd.github+json", auth: true });
      if (a.ok) {
        const j = JSON.parse(a.body);
        repo.api = {
          stars: j.stargazers_count,
          forks: j.forks_count,
          license: j.license?.spdx_id || null,
          createdAt: j.created_at,
          pushedAt: j.pushed_at,
          topics: j.topics || [],
          homepage: j.homepage || null,
          openIssues: j.open_issues_count,
          archived: j.archived,
        };
        if (repo.stars && j.stargazers_count) {
          const drift = Math.abs(j.stargazers_count - repo.stars) / j.stargazers_count;
          repo.starDrift = Math.round(drift * 1000) / 1000;
          if (drift > 0.15) checks.push(`${repo.fullName}: trending page stars ${repo.stars} vs API ${j.stargazers_count}`);
        }
      } else {
        repo.api = { error: `HTTP ${a.status}` };
      }
      const rd = await get(`https://api.github.com/repos/${repo.fullName}/readme`, { accept: "application/vnd.github.raw", auth: true });
      if (rd.ok) {
        repo.readme = rd.body.slice(0, README_LIMIT);
        repo.readmeTruncated = rd.body.length > README_LIMIT;
      }
    } catch (e) {
      repo.api = { error: String(e.message || e) };
    }
  }

  // Same list with the same "stars today" as the previous collection = a cached page.
  if (prev?.github?.repos?.length) {
    const sig = (list) => list.map((x) => `${x.fullName}:${x.starsToday}`).join("|");
    if (sig(prev.github.repos) === sig(repos)) checks.push("identical to previous collection (list and stars-today)");
  }
  const status = checks.length ? "suspect" : "ok";
  return { id: "github", name: "GitHub Trending (daily, all languages)", url, status, checks, fetchedAt, httpDate: r.date, cacheAge: r.age, count: repos.length, repos };
}

async function readPrev(date) {
  try {
    const files = (await fs.readdir(RAW_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f < `${date}.json`).sort();
    if (!files.length) return null;
    return JSON.parse(await fs.readFile(path.join(RAW_DIR, files.at(-1)), "utf8"));
  } catch {
    return null;
  }
}

async function prune(date) {
  const cutoff = new Date(new Date(`${date}T00:00:00Z`).getTime() - KEEP_DAYS * 86400e3).toISOString().slice(0, 10);
  for (const f of await fs.readdir(RAW_DIR).catch(() => [])) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
    if (m && m[1] < cutoff) await fs.unlink(path.join(RAW_DIR, f));
  }
}

async function main() {
  const date = arg("--date", kstDate());
  const fetchedAt = new Date().toISOString();
  await fs.mkdir(RAW_DIR, { recursive: true });
  const prev = await readPrev(date);

  const [github, hn, ...feeds] = await Promise.all([
    collectGitHub(fetchedAt, prev).catch((e) => ({ id: "github", status: "failed", error: String(e), repos: [] })),
    collectHN(fetchedAt),
    ...FEEDS.map((f) => collectFeed(f, fetchedAt)),
  ]);

  const out = {
    version: 1,
    date,
    collectedAt: fetchedAt,
    collector: "scripts/radar/collect.mjs",
    summary: {
      github: github.status,
      hn: hn.status,
      feeds: Object.fromEntries(feeds.map((f) => [f.id, f.status])),
    },
    github,
    hn,
    feeds,
  };
  const file = path.join(RAW_DIR, `${date}.json`);
  await fs.writeFile(file, JSON.stringify(out, null, 1) + "\n");
  await prune(date);

  console.log(`wrote ${path.relative(ROOT, file)}`);
  console.log(`github: ${github.status} (${github.count ?? 0} repos)${github.checks?.length ? " — " + github.checks.join("; ") : ""}`);
  console.log(`hn: ${hn.status} (${hn.count ?? 0})`);
  for (const f of feeds) console.log(`${f.id}: ${f.status} (${f.count ?? 0}${f.gapHours != null ? `, newest ${f.gapHours}h ago` : ""}${f.error ? ", " + f.error : ""})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
