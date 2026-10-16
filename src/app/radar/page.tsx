import type { Metadata } from "next";
import Link from "next/link";
import { formatKDate, getIssue, getLedger, listIssueDates } from "@/lib/radar/load";
import { T } from "./_components/blocks";

export const metadata: Metadata = {
  title: { absolute: "Tech Radar · nodeman.io" },
  description: "AI가 매일 아침 8시에 쓰는 테크 매거진. GitHub 트렌딩, IT 핵심 뉴스, 읽을거리, 확률을 붙인 예측 장부.",
};

export default function RadarIndex() {
  const dates = listIssueDates();
  const latest = dates[0] ? getIssue(dates[0]) : null;
  const ledger = getLedger();
  const done = ledger.filter((p) => p.status === "hit" || p.status === "miss");
  const hits = done.filter((p) => p.status === "hit").length;
  const lines = latest ? (latest.cover?.big || latest.title).split("\n") : [];

  return (
    <main className="rd-book">
      {latest ? (
        <Link href={`/radar/${latest.date}/`} className="rd-sheet rd-cover rd-cover-link">
          <div className="rd-rh">
            <span>No.{String(dates.length).padStart(3, "0")} · 최신호</span>
            <span>{formatKDate(latest.date)}</span>
          </div>
          <div className="rd-mast" aria-hidden="true">
            TECH
            <br />
            RADAR
            <small>데일리 테크 레이더</small>
          </div>
          <div className="rd-cover-story single">
            <div>
              <span className="tag">COVER STORY</span>
              <div className="rd-big">
                {lines.map((l, k) => (
                  <span key={k} style={{ display: "block" }}>
                    {k === lines.length - 1 && lines.length > 1 ? <em>{l}</em> : l}
                  </span>
                ))}
              </div>
              <p>
                <T>{latest.lede}</T>
              </p>
              <span className="go">이번 호 읽기 →</span>
            </div>
          </div>
          <div className="rd-cover-foot">
            <span>AI(Claude) 작성 · 매일 아침 8시 자동 발행</span>
            <span>{latest.title}</span>
          </div>
        </Link>
      ) : null}

      <section className="rd-sheet">
        <div className="rd-rh">
          <span>Tech Radar</span>
          <span>지난 호</span>
        </div>
        <div className="rd-head">
          <span className="rd-badge">
            <b>AI</b>모든 호는 AI(Claude)가 작성하고 사람의 검토 없이 자동 발행됩니다
          </span>
          <h1 className="rd-hed">Tech Radar</h1>
          <p className="rd-dek">
            매일 아침 8시, GitHub 트렌딩과 국내외 IT 뉴스, 읽을거리를 한 권으로 묶습니다. 숫자마다 출처의 성격을 표시하고, AI의 예측은 확률을 붙여 기록한 뒤 채점합니다.
          </p>
        </div>
        <ol className="rd-toclist">
          {dates.map((d) => {
            const it = getIssue(d);
            return (
              <li key={d}>
                <span className="sec">{d.replace(/-/g, ".")}</span>
                <Link href={`/radar/${d}/`}>
                  {it.title}
                  <span className="d">{it.quick[0]?.replace(/\*\*/g, "")}</span>
                </Link>
                <span className="p">→</span>
              </li>
            );
          })}
        </ol>
        <div className="rd-letter">
          <span className="rd-label">예측 장부</span>
          <p>
            {done.length ? `채점 ${done.length}건 중 ${hits}건 적중했습니다.` : `확인을 기다리는 예측이 ${ledger.length}건 있습니다.`}{" "}
            <Link href="/radar/ledger/">예측 장부 보기 →</Link>
          </p>
        </div>
        <div className="rd-folio">
          <span>nodeman.io</span>
          <Link href="/radar/about/">발행 원칙</Link>
        </div>
      </section>
    </main>
  );
}
