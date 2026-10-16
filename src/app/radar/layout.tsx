import type { Metadata } from "next";
import Link from "next/link";
import "./radar.css";

export const metadata: Metadata = {
  title: { default: "Tech Radar · nodeman.io", template: "%s · Tech Radar" },
  description: "AI가 매일 아침 쓰는 테크 브리프. GitHub 트렌딩, IT 핵심 뉴스, 읽을거리, 확률을 붙인 예측.",
  alternates: { types: { "application/rss+xml": "https://nodeman.io/radar/feed.xml" } },
};

export default function RadarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rd">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* Korean reading fonts load only on /radar; the portfolio keeps its own next/font set. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Hahmlet:wght@500;700;900&family=Noto+Serif+KR:wght@400;600&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap"
        precedence="default"
      />
      <header className="rd-site">
        <Link href="/" className="home">
          <b>nodeman.io</b>
        </Link>
        <span className="sep">/</span>
        <Link href="/radar/" className="home">
          radar
        </Link>
        <nav aria-label="Tech Radar">
          <Link href="/radar/">지난 호</Link>
          <Link href="/radar/ledger/">예측 장부</Link>
          <Link href="/radar/about/">발행 원칙</Link>
          <a href="/radar/feed.xml">RSS</a>
        </nav>
      </header>
      {children}
    </div>
  );
}
