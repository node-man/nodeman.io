"use client";

import { useEffect, useRef, useState } from "react";

/** Reading progress bar + current-page pill, ebook style. */
export default function Pager() {
  const bar = useRef<HTMLSpanElement>(null);
  const [page, setPage] = useState("표지");

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (bar.current) bar.current.style.width = `${max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) setPage(e.target.getAttribute("data-pg") || "");
        },
        { rootMargin: "-45% 0px -50% 0px" },
      );
      document.querySelectorAll(".rd-sheet[data-pg]").forEach((el) => io!.observe(el));
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  return (
    <>
      <div className="rd-progress" aria-hidden="true">
        <span ref={bar} />
      </div>
      <div className="rd-pagepill" aria-live="polite">
        <span>{page}</span>
        <a href="#p2">차례</a>
      </div>
    </>
  );
}
