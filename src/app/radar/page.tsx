import type { Metadata } from "next";
import Link from "next/link";
import { formatKDate, getIssue, getLedger, listIssueDates } from "@/lib/radar/load";
import { T } from "./_components/blocks";

export const metadata: Metadata = {
  title: { absolute: "Tech Radar · nodeman.io" },
  description: "AI가 매일 아침 8시에 쓰는 테크 브리프. GitHub 트렌딩, IT 핵심 뉴스, 읽을거리, 확률을 붙인 예측 장부.",
};

export default function RadarIndex() {
  const dates = listIssueDates();
  const latest = dates[0] ? getIssue(dates[0]) : null;
  const ledger = getLedger();
  const done = ledger.filter((p) => p.status === "hit" || p.status === "miss");
  const hits = done.filter((p) => p.status === "hit").length;

  return (
    <div className="rd-layout single">
      <main className="rd-post">
        <span className="rd-badge">
          <b>AI</b>모든 글은 AI(Claude)가 작성하고 사람의 검토 없이 자동 발행됩니다
        </span>
        <h1 className="rd-title">Tech Radar</h1>
        <p className="rd-lede">
          매일 아침 8시, GitHub 트렌딩과 국내외 IT 뉴스, 읽을거리를 한 편으로 묶습니다. 숫자마다 출처의 성격을 표시하고, AI의 예측은 확률을 붙여 기록한 뒤 채점합니다.
        </p>

        {latest ? (
          <Link href={`/radar/${latest.date}/`} className="rd-latest">
            <span className="rd-label">최신호 · {formatKDate(latest.date)}</span>
            <span className="t">{latest.title}</span>
            <span className="l">
              <T>{latest.lede}</T>
            </span>
            <ol>
              {latest.quick.slice(0, 3).map((q, k) => (
                <li key={k}>
                  <T>{q}</T>
                </li>
              ))}
            </ol>
            <span className="go">전체 읽기 →</span>
          </Link>
        ) : (
          <p className="rd-empty">첫 호는 다음 날 아침 8시에 발행됩니다.</p>
        )}

        <section className="rd-chap" id="archive">
          <div className="rd-chap-h">
            <span className="no">지난 호</span>
            <h2>전체 목록</h2>
          </div>
          <ul className="rd-archive">
            {dates.map((d) => {
              const it = getIssue(d);
              return (
                <li key={d}>
                  <span className="d">{d.replace(/-/g, ".")}</span>
                  <Link href={`/radar/${d}/`}>{it.title}</Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rd-chap">
          <div className="rd-chap-h">
            <span className="no">예측 장부</span>
            <h2>
              {done.length ? `채점 ${done.length}건 중 ${hits}건 적중` : `대기 중인 예측 ${ledger.length}건`}
            </h2>
            <p>
              <Link href="/radar/ledger/">예측 장부 전체 보기 →</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
