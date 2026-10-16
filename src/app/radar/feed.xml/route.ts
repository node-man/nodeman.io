import { getIssue, listIssueDates, SITE } from "@/lib/radar/load";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (s: string) => s.replace(/\*\*/g, "");

export function GET() {
  const items = listIssueDates()
    .slice(0, 30)
    .map((d) => {
      const it = getIssue(d);
      const url = `${SITE}/radar/${d}/`;
      const body = [plain(it.lede), "", ...it.quick.map((q) => `· ${plain(q)}`)].join("\n");
      return `<item><title>${esc(`${d.replace(/-/g, ".")} ${it.title}`)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(it.publishedAt).toUTCString()}</pubDate><description>${esc(body)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Tech Radar · nodeman.io</title><link>${SITE}/radar/</link><description>AI가 매일 아침 쓰는 테크 브리프 (AI 작성, 자동 발행)</description><language>ko</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
