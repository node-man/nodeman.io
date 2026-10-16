import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { formatKDate, getIssue, getLedger, listIssueDates } from "@/lib/radar/load";
import type { Block } from "@/lib/radar/types";
import Pager from "../_components/Pager";
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
    // Daily auto-generated issues stay out of search indexes (scaled-content policy);
    // the archive, ledger and principles pages are indexable.
    robots: { index: false, follow: true },
    openGraph: { title: issue.title, description: plain, type: "article", url: `https://nodeman.io/radar/${date}/` },
  };
}

const SOLO = new Set(["lead", "github", "korea", "reading", "column"]);
const pad = (n: number) => String(n).padStart(2, "0");
const kst = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(11, 16);

export default async function IssuePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const issue = getIssue(date);
  const ledger = getLedger();
  const asc = listIssueDates().slice().reverse();
  const no = String(asc.indexOf(date) + 1).padStart(3, "0");
  const i = asc.indexOf(date);
  const older = i > 0 ? asc[i - 1] : null;
  const newer = i < asc.length - 1 ? asc[i + 1] : null;

  const lead = issue.sections.find((s) => s.kind === "lead");
  const coverLines = (issue.cover?.big || lead?.title || issue.title).split("\n");
  const share = issue.sections
    .flatMap((s) => s.stories.flatMap((st) => st.blocks))
    .find((b): b is Extract<Block, { type: "share" }> => b.type === "share");
  const shareTotal = share ? share.items.reduce((a, x) => a + x.value, 0) : 0;
  const pageOf = (k: number) => k + 3;
  const lastPage = issue.sections.length + 3;

  return (
    <main className="rd-book">
      <Pager />

      {/* 표지 */}
      <section className="rd-sheet rd-cover" id="p1" data-pg="표지">
        <div className="rd-rh">
          <span>No.{no}</span>
          <span>{formatKDate(date)}</span>
        </div>
        <div className="rd-mast" aria-hidden="true">
          TECH
          <br />
          RADAR
          <small>데일리 테크 레이더</small>
        </div>
        <div className="rd-cover-story">
          <div>
            <span className="tag">COVER STORY</span>
            <div className="rd-big">
              {coverLines.map((l, k) => (
                <Fragment key={k}>
                  {k ? <br /> : null}
                  {k === coverLines.length - 1 && coverLines.length > 1 ? <em>{l}</em> : l}
                </Fragment>
              ))}
            </div>
            <p>
              <T>{issue.lede}</T>
            </p>
          </div>
          <ul className="rd-lines">
            {issue.sections.map((s, k) => (
              <li key={s.id}>
                <span className="pg">p.{pad(pageOf(k))}</span>
                <a href={`#p${pageOf(k)}`}>
                  <b>{s.label}</b> {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {share ? (
          <div className="rd-band" role="img" aria-label={`${share.title}: ${share.items.map((x) => `${x.label} ${((x.value / shareTotal) * 100).toFixed(1)}%`).join(", ")}`}>
            {share.items.map((x, k) => (
              <span key={x.label} className={`b${Math.min(k + 1, 4)}`} style={{ width: `${(x.value / shareTotal) * 100}%` }}>
                {k === 0 ? `GitHub ${share.title} ${((x.value / shareTotal) * 100).toFixed(1)}% · ${x.label}` : ""}
              </span>
            ))}
          </div>
        ) : null}
        <div className="rd-cover-foot">
          <span>AI(Claude) 작성 · 사람 검토 없이 자동 발행</span>
          <span>{kst(issue.publishedAt)} KST 발행</span>
        </div>
      </section>

      {/* 차례 */}
      <section className="rd-sheet" id="p2" data-pg="p.02 차례">
        <div className="rd-rh">
          <span>Tech Radar No.{no}</span>
          <span>차례</span>
        </div>
        <div className="rd-head">
          <span className="rd-badge">
            <b>AI</b>이 호는 AI(Claude)가 작성했고 사람의 검토 없이 자동 발행됩니다
          </span>
          <span className="rd-kicker">{formatKDate(date)}</span>
          <h1 className="rd-hed">{issue.title}</h1>
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
        <ol className="rd-toclist">
          {issue.sections.map((s, k) => (
            <li key={s.id}>
              <span className="sec">{s.label}</span>
              <a href={`#p${pageOf(k)}`}>
                {s.title}
                {s.dek ? <span className="d">{s.dek}</span> : null}
              </a>
              <span className="p">{pad(pageOf(k))}</span>
            </li>
          ))}
          <li>
            <span className="sec">판권</span>
            <a href={`#p${lastPage}`}>발행 정보와 원칙</a>
            <span className="p">{pad(lastPage)}</span>
          </li>
        </ol>
        <div className="rd-letter" id="quick">
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
        <div className="rd-folio">
          <span>Tech Radar</span>
          <b>02</b>
        </div>
      </section>

      {issue.sections.map((s, k) => {
        const pg = pageOf(k);
        const solo = SOLO.has(s.kind) && s.stories.length === 1;
        const cols = s.kind === "lead" || s.kind === "column";
        return (
          <section className={`rd-sheet ${s.kind === "column" ? "col" : ""}`} id={`p${pg}`} data-pg={`p.${pad(pg)} ${s.label}`} key={s.id}>
            <div className="rd-rh">
              <span>Section {k + 1}</span>
              <span>{s.label}</span>
            </div>
            <div className="rd-opener" id={s.id}>
              <span className="no">{pad(k + 1)}</span>
              <span className="rd-kicker">{s.label}</span>
              <h2 className="rd-hed">{s.title}</h2>
              {s.dek ? <p className="rd-dek">{s.dek}</p> : null}
            </div>
            <div className={s.kind === "headlines" ? "rd-briefs" : "rd-stack"}>
              {s.stories.map((st) => (
                <StoryView key={st.id} s={st} ledger={ledger} plain={solo} cols={cols} />
              ))}
            </div>
            <div className="rd-folio">
              <span>Tech Radar</span>
              <b>{pad(pg)}</b>
            </div>
          </section>
        );
      })}

      {/* 판권 */}
      <section className="rd-sheet" id={`p${lastPage}`} data-pg={`p.${pad(lastPage)} 판권`}>
        <div className="rd-rh">
          <span>Colophon</span>
          <span>판권</span>
        </div>
        <div className="rd-colophon">
          <span>발행</span>
          <span>
            Tech Radar No.{no} · {formatKDate(date)} {kst(issue.publishedAt)} KST
          </span>
          <span>작성</span>
          <span>AI(Anthropic의 Claude) 작성 · 사람 검토 없이 자동 발행</span>
          {issue.rawCollectedAt ? (
            <>
              <span>원천 수집</span>
              <span>{kst(issue.rawCollectedAt)} KST · GitHub·Hacker News 수치는 이 시각 값</span>
            </>
          ) : null}
          <span>표기</span>
          <span>기사 요약은 원문을 우리말로 다시 쓴 것 · 성능 수치는 발표 주체의 주장 · AI 의견은 청록 점선 상자</span>
        </div>
        <p className="rd-dek">
          기사 선정·제외 기준과 이해관계 고지는 <Link href="/radar/about/">발행 원칙</Link>에 있습니다. 확률을 붙인 예측의 채점 결과는{" "}
          <Link href="/radar/ledger/">예측 장부</Link>에서 볼 수 있습니다.
        </p>
        <nav className="rd-pager" aria-label="다른 호">
          {older ? <Link href={`/radar/${older}/`}>← {older.replace(/-/g, ".")}</Link> : <span />}
          <Link href="/radar/">지난 호 전체</Link>
          {newer ? <Link href={`/radar/${newer}/`}>{newer.replace(/-/g, ".")} →</Link> : <span />}
        </nav>
        <div className="rd-folio">
          <span>Tech Radar</span>
          <b>{pad(lastPage)}</b>
        </div>
      </section>
    </main>
  );
}
