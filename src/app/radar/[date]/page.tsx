import type { Metadata } from "next";
import Link from "next/link";
import { formatKDate, getIssue, getLedger, listIssueDates } from "@/lib/radar/load";
import { StoryView, T } from "../_components/blocks";

export const dynamicParams = false;

export function generateStaticParams() {
  return listIssueDates().map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const issue = getIssue(date);
  const plain = issue.lede.replace(/\*\*/g, "");
  return {
    title: `${date.replace(/-/g, ".")} ${issue.title}`,
    description: plain,
    // Daily auto-generated briefs stay out of search indexes (scaled-content policy);
    // the archive, ledger and principles pages are indexable.
    robots: { index: false, follow: true },
    openGraph: { title: issue.title, description: plain, type: "article", url: `https://nodeman.io/radar/${date}/` },
  };
}

const SOLO = new Set(["lead", "github", "korea", "reading", "column"]);

export default async function IssuePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const issue = getIssue(date);
  const ledger = getLedger();
  const dates = listIssueDates();
  const i = dates.indexOf(date);
  const newer = i > 0 ? dates[i - 1] : null;
  const older = i < dates.length - 1 ? dates[i + 1] : null;
  const published = new Date(issue.publishedAt);
  const hhmm = new Date(published.getTime() + 9 * 3600e3).toISOString().slice(11, 16);
  const stories = issue.sections.reduce((a, s) => a + s.stories.length, 0);

  return (
    <div className="rd-layout">
      <article className="rd-post">
        <span className="rd-badge">
          <b>AI</b>이 글은 AI(Claude)가 작성했고 사람의 검토 없이 자동 발행됩니다
        </span>
        <span className="rd-eyebrow">TECH RADAR · {formatKDate(date)}</span>
        <h1 className="rd-title">{issue.title}</h1>
        <p className="rd-lede">
          <T>{issue.lede}</T>
        </p>
        <div className="rd-meta">
          <span>{hhmm} KST 발행</span>
          <span>섹션 {issue.sections.length} · 기사 {stories}</span>
          {issue.rawCollectedAt ? (
            <span>원천 수집 {new Date(new Date(issue.rawCollectedAt).getTime() + 9 * 3600e3).toISOString().slice(11, 16)} KST</span>
          ) : null}
        </div>

        {issue.corrections?.length ? (
          <div className="rd-correct">
            <span className="rd-label">정정</span>
            {issue.corrections.map((c, k) => (
              <p key={k}>
                <T>{c}</T>
              </p>
            ))}
          </div>
        ) : null}

        <div className="rd-quick" id="quick">
          <span className="rd-label">3분 요약</span>
          <ol>
            {issue.quick.map((q, k) => (
              <li key={k}>
                <span>
                  <T>{q}</T>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {issue.sections.map((s, k) => (
          <section className={`rd-chap ${s.kind === "column" ? "col" : ""}`} id={s.id} key={s.id}>
            <div className="rd-chap-h">
              <span className="no">
                {String(k + 1).padStart(2, "0")} · {s.label}
              </span>
              <h2>{s.title}</h2>
              {s.dek ? <p>{s.dek}</p> : null}
            </div>
            {s.stories.map((st) => (
              <StoryView key={st.id} s={st} ledger={ledger} plain={SOLO.has(s.kind) && s.stories.length === 1} />
            ))}
          </section>
        ))}

        <nav className="rd-pager" aria-label="다른 호">
          {older ? <Link href={`/radar/${older}/`}>← {older.replace(/-/g, ".")}</Link> : <span />}
          <Link href="/radar/">전체 목록</Link>
          {newer ? <Link href={`/radar/${newer}/`}>{newer.replace(/-/g, ".")} →</Link> : <span />}
        </nav>
        <footer className="rd-foot">
          <span>Tech Radar · {date.replace(/-/g, ".")}</span>
          <span>AI 작성 · 자동 발행</span>
          <Link href="/radar/about/">발행 원칙</Link>
        </footer>
      </article>

      <aside className="rd-toc" aria-label="목차">
        <span className="rd-label">목차</span>
        <a href="#quick">3분 요약</a>
        {issue.sections.map((s, k) => (
          <a key={s.id} href={`#${s.id}`}>
            {String(k + 1).padStart(2, "0")} {s.label}
          </a>
        ))}
      </aside>
    </div>
  );
}
