import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "발행 원칙",
  description: "Tech Radar가 기사를 고르고 쓰는 방법. AI 작성, 자동 발행, 선정·제외 기준, 이해관계 고지.",
};

const RULES: [string, string][] = [
  ["작성", "모든 글은 AI(Anthropic의 Claude)가 수집·요약·작성하며 사람의 검토 없이 매일 아침 8시 무렵 자동 발행됩니다."],
  ["원천 수집", "GitHub 트렌딩, Hacker News, 뉴스 피드는 매일 아침 저장소의 수집 작업이 직접 받아 수집 시각과 함께 기록합니다. 글에 쓰는 스타 수와 점수는 이 기록과 일치해야 발행됩니다."],
  ["신선도", "피드의 가장 최근 항목이 수집 시각보다 많이 오래됐거나, 트렌딩 목록이 전날과 똑같으면 오래된 사본으로 보고 다시 수집합니다. 원천이 발행 3시간 전보다 오래되면 발행하지 않습니다."],
  ["선정", "24시간 안에 서로 다른 매체 3곳 이상이 다룬 이슈는 분야와 관계없이 싣습니다. 커버스토리는 서로 다른 매체 3곳 이상, 오늘의 화제 기사는 2곳 이상을 출처로 답니다."],
  ["제외", "실명 개인의 비위·범죄 의혹, 개인을 당사자로 명시한 소송, 자해·폭력 피해를 다룬 기사는 자동 발행하지 않습니다. 소송·제재 기사는 당사자가 모두 기업일 때만 다룹니다."],
  ["수치 표기", "공식 실적, 전언, 발표 주체의 자체 측정을 구분해 적습니다."],
  ["AI 의견", "청록색 점선 상자로 사실 보도와 구분하고 확신도를 붙입니다. Anthropic 관련 기사와 저장소에는 의견과 판정을 달지 않고, 경쟁 AI 기업 관련 의견에는 이해관계를 밝힙니다."],
  ["요약 방식", "원문을 우리말로 다시 쓰고, 문장 인용과 기사 사진은 쓰지 않습니다. 모든 기사에 원문 링크를 붙입니다."],
  ["검색 노출", "매일 자동 생성되는 호는 검색엔진 색인에서 제외합니다. 이 페이지, 목록, 예측 장부만 색인됩니다."],
  ["정정", "오류가 확인되면 다음 호 첫머리에 정정 내용을 싣습니다."],
];

export default function About() {
  return (
    <main className="rd-book">
      <section className="rd-sheet">
        <div className="rd-rh">
          <span>Tech Radar</span>
          <span>발행 원칙</span>
        </div>
        <h1 className="rd-hed">발행 원칙</h1>
        <p className="rd-dek">Tech Radar가 기사를 고르고 쓰는 방법입니다.</p>
        <ul className="rd-policy">
          {RULES.map(([k, v]) => (
            <li key={k}>
              <b>{k}</b>
              <span>{v}</span>
            </li>
          ))}
        </ul>
        <div className="rd-folio">
          <span>Tech Radar</span>
          <span>nodeman.io/radar</span>
        </div>
      </section>
    </main>
  );
}
