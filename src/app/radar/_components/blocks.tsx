import { Fragment, type ReactNode } from "react";
import type { AiOpinion, Block, Prediction, Repo, Story } from "@/lib/radar/types";

/** Inline markup: **bold** and `code` only. */
export function T({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : p.startsWith("`") && p.endsWith("`") && p.length > 2 ? (
          <code key={i}>{p.slice(1, -1)}</code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function yearFrac(d: string) {
  const [y, m = 1, dd = 1] = d.split("-").map(Number);
  return y + (m - 1) / 12 + (dd - 1) / 365;
}

function Bars({ b }: { b: Extract<Block, { type: "bars" }> }) {
  const max = niceMax(Math.max(...b.items.map((i) => i.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const short = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(+n.toFixed(1)));
  return (
    <figure className="rd-fig">
      <span className="rd-label">
        {b.title} · 0–{fmt(max)}
        {b.unit ? ` ${b.unit}` : ""} 선형
      </span>
      <div className="rd-bars">
        {b.items.map((i) => (
          <div className="rd-bar" key={i.label}>
            <span className="n">{i.label}</span>
            <span className="track">
              <span className="fill" style={{ width: `${(i.value / max) * 100}%` }} />
            </span>
            <span className="v">{fmt(i.value)}</span>
          </div>
        ))}
      </div>
      <div className="rd-axis">
        <span />
        <span className="ticks">
          {ticks.map((t, k) => (
            <span key={k} style={{ left: `${(t / max) * 100}%` }}>
              {short(t)}
            </span>
          ))}
        </span>
        <span />
      </div>
      {b.caption ? (
        <figcaption>
          <T>{b.caption}</T>
        </figcaption>
      ) : null}
    </figure>
  );
}

function Share({ b }: { b: Extract<Block, { type: "share" }> }) {
  const total = b.items.reduce((a, i) => a + i.value, 0);
  const tones = ["s1", "s2", "s3", "s4", "s5"];
  return (
    <figure className="rd-fig">
      <span className="rd-label">
        {b.title} · 합계 {fmt(total)}
      </span>
      <div className="rd-share" role="img" aria-label={b.items.map((i) => `${i.label} ${((i.value / total) * 100).toFixed(1)}%`).join(", ")}>
        {b.items.map((i, k) => (
          <span key={i.label} className={tones[Math.min(k, 4)]} style={{ width: `${(i.value / total) * 100}%` }}>
            {(i.value / total) * 100 >= 25 ? `${i.label} ${((i.value / total) * 100).toFixed(1)}%` : ""}
          </span>
        ))}
      </div>
      <div className="rd-legend">
        {b.items.map((i, k) => (
          <span key={i.label}>
            <i className={tones[Math.min(k, 4)]} />
            {i.label} {((i.value / total) * 100).toFixed(1)}%
          </span>
        ))}
      </div>
    </figure>
  );
}

function Timeline({ b }: { b: Extract<Block, { type: "timeline" }> }) {
  const xs = b.points.map((p) => yearFrac(p.date));
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const pos = (d: string) => ((yearFrac(d) - min) / (max - min || 1)) * 100;
  return (
    <figure className="rd-fig">
      <span className="rd-label">{b.title} · 시간 비례 축</span>
      <div className="rd-tl-wrap">
        <div className="rd-tl">
          <div className="line" />
          {(b.gaps || []).map((g) => (
            <Fragment key={g.label}>
              <div className="gap" style={{ left: `${pos(g.from)}%`, width: `${pos(g.to) - pos(g.from)}%` }} />
              <span className="gap-lab" style={{ left: `${(pos(g.from) + pos(g.to)) / 2}%` }}>
                {g.label}
              </span>
            </Fragment>
          ))}
          {b.points.map((p, k) => {
            const x = pos(p.date);
            const align = k === 0 ? "l" : k === b.points.length - 1 ? "r" : "";
            const top = p.kind === "now" && b.points.length > 3;
            return (
              <Fragment key={p.date + p.label}>
                <span className={`pt ${p.kind || "past"}`} style={{ left: `${x}%` }} />
                <span className={`lab ${align} ${top ? "top" : ""}`} style={{ left: `${x}%` }}>
                  <b>{p.date.replace(/-/g, ".")}</b>
                  {p.label}
                  {p.note ? (
                    <>
                      <br />
                      {p.note}
                    </>
                  ) : null}
                </span>
              </Fragment>
            );
          })}
        </div>
      </div>
    </figure>
  );
}

const VERDICT: Record<Repo["verdict"], [string, string]> = {
  try: ["바로 써볼 만함", "v-try"],
  experiment: ["실험해 볼 만함", "v-exp"],
  watch: ["관심 있으면", "v-watch"],
  reference: ["참고", "v-ref"],
  none: ["판정 없음 · 이해관계", "v-ref"],
};

function RepoBlock({ r }: { r: Repo }) {
  const [vl, vc] = VERDICT[r.verdict];
  return (
    <div className="rd-repo">
      <div className="rd-repo-h">
        <span className="rk">{r.rank}</span>
        <a className="name" href={`https://github.com/${r.fullName}`}>
          {r.fullName}
        </a>
        <span className="m">{[r.language, r.license].filter(Boolean).join(" · ")}</span>
        <span className="m">
          ★ {fmt(r.stars)} <span className="up">+{fmt(r.starsToday)}</span>
        </span>
        <span className={`rd-verdict ${vc}`}>{vl}</span>
      </div>
      <p className="def">
        <T>{r.def}</T>
      </p>
      <dl>
        {r.rows.map(([k, v]) => (
          <Fragment key={k}>
            <dt className={k === "주의" ? "risk" : ""}>{k}</dt>
            <dd>
              <T>{v}</T>
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

export function Ai({ ai }: { ai: AiOpinion }) {
  if (ai.kind === "none")
    return (
      <aside className="rd-ai none">
        <div className="h">
          <span className="mark">AI</span>
          <span className="t">AI 의견 없음</span>
        </div>
        <p>
          <T>{ai.reason}</T>
        </p>
      </aside>
    );
  const label = ["낮음", "중간", "높음"][ai.confidence - 1];
  return (
    <aside className="rd-ai">
      <div className="h">
        <span className="mark">AI</span>
        <span className="t">AI 의견</span>
        <span className="stance">{ai.stance}</span>
        <span className="conf" aria-label={`확신도 ${label}`}>
          {[1, 2, 3].map((n) => (
            <i key={n} className={n <= ai.confidence ? "on" : ""} />
          ))}
          <em>확신도 {label}</em>
        </span>
      </div>
      {ai.points.map((p) => (
        <p key={p.k}>
          <b>{p.k}</b>
          <T>{p.v}</T>
        </p>
      ))}
    </aside>
  );
}

export function LedgerTable({ items }: { items: Prediction[] }) {
  const st = { pending: "대기", hit: "적중", miss: "빗나감", void: "무효" } as const;
  return (
    <div className="rd-tblw">
      <table className="rd-ledger">
        <thead>
          <tr>
            <th>예측</th>
            <th>확률</th>
            <th>확인</th>
            <th>결과</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>
                {p.statement}
                {p.note ? <span className="note">{p.note}</span> : null}
              </td>
              <td>
                <span className="pct">
                  <span>
                    <i style={{ width: `${p.probability * 100}%` }} />
                  </span>
                  {Math.round(p.probability * 100)}%
                </span>
              </td>
              <td className="st">{p.dueLabel || p.due}</td>
              <td className={`st ${p.status}`}>
                {p.evidence ? <a href={p.evidence}>{st[p.status]}</a> : st[p.status]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BlockView({ b, ledger }: { b: Block; ledger: Prediction[] }): ReactNode {
  switch (b.type) {
    case "p":
      return (
        <p className={b.dropcap ? "dc" : undefined}>
          <T>{b.text}</T>
        </p>
      );
    case "pull":
      return (
        <p className="rd-pull">
          <T>{b.text}</T>
        </p>
      );
    case "stats":
      return (
        <div className={`rd-stats n${Math.min(b.items.length, 4)}`} style={{ gridTemplateColumns: `repeat(${Math.min(b.items.length, 4)}, minmax(0,1fr))` }}>
          {b.items.map((i) => (
            <div key={i.label}>
              <b>{i.value}</b>
              <span>
                <T>{i.label}</T>
              </span>
            </div>
          ))}
        </div>
      );
    case "cards":
      return (
        <figure className="rd-fig">
          {b.title ? <span className="rd-label">{b.title}</span> : null}
          <div className="rd-cards" style={{ gridTemplateColumns: `repeat(${Math.min(b.items.length, 3)}, minmax(0,1fr))` }}>
            {b.items.map((c) => (
              <div className="card" key={c.name}>
                <h4>{c.name}</h4>
                {c.sub ? <span className="sub">{c.sub}</span> : null}
                {c.dots ? (
                  <div className="dots" role="img" aria-label={c.dots.label || `${c.dots.on}/${c.dots.total}`}>
                    {Array.from({ length: c.dots.total }, (_, k) => (
                      <i key={k} className={k < c.dots!.on ? "on" : ""} />
                    ))}
                  </div>
                ) : null}
                {c.rows?.length ? (
                  <dl>
                    {c.rows.map(([k, v]) => (
                      <Fragment key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </Fragment>
                    ))}
                  </dl>
                ) : null}
                {c.highlight ? (
                  <>
                    <span className="rd-label">{c.highlight.label}</span>
                    <span className={`hl ${c.highlight.tone || ""}`}>{c.highlight.value}</span>
                  </>
                ) : null}
              </div>
            ))}
          </div>
          {b.footer ? (
            <div className="rd-cards-foot">
              <T>{b.footer}</T>
            </div>
          ) : null}
        </figure>
      );
    case "timeline":
      return <Timeline b={b} />;
    case "bars":
      return <Bars b={b} />;
    case "share":
      return <Share b={b} />;
    case "quotes":
      return (
        <div className="rd-quotes">
          {b.items.map((q) => (
            <div key={q.who}>
              <b>{q.who}</b>
              <T>{q.text}</T>
            </div>
          ))}
        </div>
      );
    case "unknowns":
      return (
        <div>
          <span className="rd-label">{b.title}</span>
          <ul className="rd-unknown">
            {b.items.map((i) => (
              <li key={i}>
                <T>{i}</T>
              </li>
            ))}
          </ul>
        </div>
      );
    case "list":
      return (
        <ul className="rd-list">
          {b.items.map((i, k) => (
            <li key={k}>
              <span className="k">{i.k}</span>
              <span>
                <T>{i.text}</T>
              </span>
            </li>
          ))}
        </ul>
      );
    case "boxes":
      return (
        <div className="rd-boxes">
          {b.items.map((x) => (
            <div className={`box ${x.tone}`} key={x.title}>
              <h4>{x.title}</h4>
              <ul>
                {x.items.map((i) => (
                  <li key={i}>
                    <T>{i}</T>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "reads":
      return (
        <ol className="rd-reads">
          {b.items.map((r) => (
            <li key={r.url}>
              <a href={r.url}>{r.title}</a>
              <span className="via">
                {r.via}
                {r.hn ? (
                  <>
                    {" · "}
                    <a href={`https://news.ycombinator.com/item?id=${r.hn.id}`}>
                      HN {fmt(r.hn.points)}점 · 댓글 {fmt(r.hn.comments)}
                    </a>
                  </>
                ) : null}
              </span>
              <p>
                <T>{r.why}</T>
              </p>
            </li>
          ))}
        </ol>
      );
    case "repo":
      return <RepoBlock r={b.repo} />;
    case "ledger":
      return <LedgerTable items={ledger.filter((p) => p.status === "pending")} />;
  }
}

export function StoryView({ s, ledger, plain }: { s: Story; ledger: Prediction[]; plain?: boolean }) {
  return (
    <div className={plain ? "rd-story plain" : "rd-story"} id={s.id}>
      {!plain ? (
        <>
          <span className="rd-kicker">
            {s.kicker}
            {s.hot ? (
              <span className="hot">
                {s.hot.basis} {s.hot.count}
              </span>
            ) : null}
          </span>
          <h3 className="rd-h3">{s.title}</h3>
        </>
      ) : null}
      <div className="rd-prose">
        {s.blocks.map((b, k) => (
          <BlockView key={k} b={b} ledger={ledger} />
        ))}
      </div>
      {s.ai ? <Ai ai={s.ai} /> : null}
      {s.sources.length ? (
        <p className="rd-src">
          출처:{" "}
          {s.sources.map((l, k) => (
            <Fragment key={l.url}>
              {k ? " · " : ""}
              <a href={l.url}>{l.title}</a>
            </Fragment>
          ))}
        </p>
      ) : null}
    </div>
  );
}
