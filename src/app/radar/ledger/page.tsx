import type { Metadata } from "next";
import { getLedger } from "@/lib/radar/load";
import { LedgerTable } from "../_components/blocks";

export const metadata: Metadata = {
  title: "예측 장부",
  description: "Tech Radar의 AI가 확률을 붙여 남긴 예측과 채점 결과.",
};

export default function LedgerPage() {
  const all = getLedger().slice().sort((a, b) => (a.due < b.due ? -1 : 1));
  const pending = all.filter((p) => p.status === "pending");
  const done = all.filter((p) => p.status !== "pending").reverse();
  const scored = done.filter((p) => p.status !== "void");
  // Calibration: mean stated probability vs observed hit rate per 20-point bucket.
  const buckets = [0.2, 0.4, 0.6, 0.8, 1].map((hi) => {
    const items = scored.filter((p) => p.probability < hi && p.probability >= hi - 0.2);
    return { hi, n: items.length, hit: items.filter((p) => p.status === "hit").length };
  });

  return (
    <div className="rd-layout single">
      <main className="rd-post">
        <span className="rd-badge">
          <b>AI</b>예측은 AI(Claude)가 남겼고 확인 시점에 결과를 공개합니다
        </span>
        <h1 className="rd-title">예측 장부</h1>
        <p className="rd-lede">
          매일 호에서 AI가 확률을 붙여 남긴 예측입니다. 확인 날짜가 지나면 근거 링크와 함께 적중, 빗나감, 무효로 채점합니다.
        </p>
        <div className="rd-stats" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <div>
            <b>{pending.length}</b>
            <span>확인 대기</span>
          </div>
          <div>
            <b>{scored.length}</b>
            <span>채점 완료</span>
          </div>
          <div>
            <b>{scored.length ? `${Math.round((scored.filter((p) => p.status === "hit").length / scored.length) * 100)}%` : "—"}</b>
            <span>적중률</span>
          </div>
        </div>

        <section className="rd-chap">
          <div className="rd-chap-h">
            <span className="no">대기</span>
            <h2>확인을 기다리는 예측</h2>
          </div>
          {pending.length ? <LedgerTable items={pending} /> : <p className="rd-empty">없습니다.</p>}
        </section>

        <section className="rd-chap">
          <div className="rd-chap-h">
            <span className="no">채점</span>
            <h2>결과가 나온 예측</h2>
            <p>말한 확률과 실제 적중률이 비슷할수록 잘 보정된 예측입니다.</p>
          </div>
          {scored.length ? (
            <div className="rd-calib">
              {buckets.map((b) => (
                <div key={b.hi}>
                  <span className="rd-label">
                    {Math.round((b.hi - 0.2) * 100)}–{Math.round(b.hi * 100)}%
                  </span>
                  <b>{b.n ? `${Math.round((b.hit / b.n) * 100)}%` : "—"}</b>
                  <span>{b.n}건</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rd-empty">아직 확인 시점이 온 예측이 없습니다.</p>
          )}
          {done.length ? <LedgerTable items={done} /> : null}
        </section>
      </main>
    </div>
  );
}
