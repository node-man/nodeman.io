# Tech Radar daily routine

The scheduled writer follows this file every morning. It publishes one issue to
`https://nodeman.io/radar/<date>/` with no human review, so the rules here are
the editorial control. Write as if the issue goes live exactly as committed.

## What you may touch

- `content/radar/issues/<today>.json` (new file, today in KST)
- `content/radar/ledger.json` (resolve due predictions, add today's)
- `content/radar/requests/latest.txt` (only to request a re-collection)

Never edit code, styles, workflows, docs, raw files or past issues. Never force-push.

## 0. Setup

```
git pull --rebase origin main
npm ci
TODAY=$(TZ=Asia/Seoul date +%F)
```

Read `src/lib/radar/types.ts` (the data format) and the previous issue in
`content/radar/issues/` (for continuity; do not repeat its stories unless there
is new information, then set `followUp: true`).

## 1. Raw collection (the only source of numbers)

`content/radar/raw/$TODAY.json` is written by `.github/workflows/radar-collect.yml`
at about 06:40 KST. It holds GitHub trending (with API-verified stars and README
excerpts), the live Hacker News front page and news feeds, each with `fetchedAt`,
`newestItemAt` and a `status`.

Use it when ALL of these hold:
- the file exists and `collectedAt` is less than 2 hours old,
- `summary.github` is `ok`,
- at least 4 sources in `summary.feeds` plus `summary.hn` are `ok`.

Otherwise request a fresh collection, then wait for it:

```
echo "requested $(date -u +%FT%TZ)" > content/radar/requests/latest.txt
git add content/radar/requests/latest.txt
git commit -m "radar: request collection $TODAY"
git push origin HEAD:main
# poll: git pull --rebase origin main every 60s, up to 12 minutes
```

If GitHub is still not `ok` after one re-collection, publish the issue WITHOUT
the GitHub section. If the feeds are still stale, stop and report; do not publish
from memory or from search snippets alone.

Do NOT use WebFetch on github.com/trending, Hacker News or feed pages to get
numbers: those responses can be days-old cached copies. Stars, ranks, points and
comment counts come only from the raw file. WebSearch/WebFetch are for article
details.

## 2. Resolve due predictions

For every `pending` entry in `ledger.json` with `due <= $TODAY`: research the
outcome, then set `status` (`hit` / `miss` / `void` when the question became
unanswerable), `resolvedOn: $TODAY`, a one-line Korean `note`, and an `evidence`
URL. Never change an entry's statement or probability after it was issued.

## 3. Choose stories

Cluster the last 24 hours of raw feed headlines (Techmeme, TechCrunch, The Verge,
Electrek, Google News US/KR, 전자신문, 블로터, 디지털투데이, GeekNews) by subject.

- Any subject covered by 3+ different outlets must be in the issue, whatever the
  field (cars, chips, markets, consumer devices), unless an exclusion applies.
- Cover story (`lead`): the subject with the widest coverage. Needs 3+ distinct
  outlet links.
- `headlines`: 3–5 more subjects, each with 2+ distinct outlet links. Add
  `hot: { count, basis }` only when you counted it yourself from the raw feeds
  (basis e.g. "오늘 수집 피드 중 보도 매체").
- `korea`: 4–7 one-line items from Korean outlets (list block).
- Verify every fact you write with WebSearch/WebFetch from at least two outlets
  for load-bearing claims. Cut anything you cannot verify.

### Exclusions (never auto-published)

- Named individuals' misconduct, crimes, arrests, investigations of a person.
- Lawsuits or sanctions that name a person as a party. Company-vs-company or
  government-vs-company legal stories are allowed with `legal: "company-only"`.
- Deaths, injuries, self-harm, violence, accidents with victims.
- The validator rejects banned terms; do not rephrase around it — drop the story.

### Conflict of interest

You are Claude, made by Anthropic.
- Anthropic stories: report facts neutrally, `ai: { kind: "none", reason: ... }`.
- Anthropic repositories (`anthropics/*`): `verdict: "none"`.
- Opinions on rival AI companies (OpenAI, Google, Meta, Microsoft, xAI, DeepSeek,
  Mistral...) must include a `밝혀 둘 점` point disclosing it.
- No predictions about Anthropic.

## 4. GitHub section

Use the top 10–12 repositories from the raw file in rank order. Copy `rank`,
`starsToday` and `stars` (= `api.stars`, else the page value) exactly. Summarize
from `readme` (and the repo description); a short WebFetch of the repo page is fine
for clarification, never for numbers. Each repo: one-sentence `def`, 1–4 rows
(`동작`/`대상`/`효과`/`시작`/`구성`, and `주의` when there is a real caveat —
licence, safety, self-reported numbers, unofficial copies). Verdicts:
`try` (useful today for a developer/founder running AI agents), `experiment`,
`watch`, `reference` (perennial / no news), `none` (Anthropic).

Add a `share` block (top 3 + "나머지 N개") and a `bars` block (all but #1) built
from the raw `starsToday` values, and a short intro paragraph naming the day's
theme.

## 5. Reading

5–6 items. Hacker News picks must carry `hn: { id, points, comments }` copied from
the raw file. GeekNews picks use the topic URL. Each with a one-sentence `why`.

## 6. Column and predictions

`column` section: 2–4 paragraphs (first with `dropcap`), one `pull`, then a
`ledger` block. Opinion about the day's pattern, not a recap. Add at most 3 new
predictions: specific, checkable statements with a due date and a probability
between 0.05 and 0.95. No stock-price targets, no investment framing.

## 7. Writing rules

- Korean, 합니다체, plain and specific. Paraphrase everything; no sentence-level
  quotes; no article images.
- Every number says what kind it is when it matters: 공식 실적 / 전언 / 발표 주체 주장.
- Inline markup: `**bold**` run-in heads and `` `code` `` only.
- Write about the news, never about the publication (no "샘플", "이번 호부터",
  "편집자의 말", no notes about the pipeline).
- `quick`: 3–6 lines, each starting with a bold summary.
- `title` ≤ 30 Korean characters; `lede` 2–3 sentences.
- `raw` = `content/radar/raw/$TODAY.json`, `rawCollectedAt` copied exactly.
- `publishedAt` = the actual commit time in KST with `+09:00`.

## 8. Check and publish

```
npm run radar:check          # validator + offline build; must pass
git add content/radar/issues/$TODAY.json content/radar/ledger.json
git commit -m "radar: $TODAY issue"   # trailer: Co-Authored-By: Tech Radar Routine <noreply@anthropic.com>
git pull --rebase origin main && git push origin HEAD:main
```

Fix every validator error by correcting the data or dropping the story; never by
weakening the text to slip past a rule. The deploy workflow validates again and
publishes in ~3 minutes.

Finish with a short Korean summary: the title, three one-line highlights, the URL
`https://nodeman.io/radar/$TODAY/`, and any section you had to omit and why.
