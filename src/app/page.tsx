"use client";

import { useEffect, useRef } from "react";

// Design feature flags (from Nodeman.dc.html props)
const SHOW_GALAXY = true;
const SHOW_BOOT = true;
const SHOW_GRID = true;
const MOUSE_GLOW = true;

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const cleanups: Array<() => void> = [];
    let clock: ReturnType<typeof setInterval> | null = null;
    let galaxyRaf = 0;

    const q = <T extends Element = HTMLElement>(sel: string) =>
      root.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string) =>
      Array.from(root.querySelectorAll<T>(sel));

    // ---------- reveal + counters ----------
    const setupReveal = () => {
      let reveals = qa<HTMLElement>("[data-reveal]");
      let counters = qa<HTMLElement>("[data-count]");
      const fmt = (n: number) =>
        n >= 1000
          ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
          : String(Math.round(n));
      const runCounter = (el: HTMLElement) => {
        const target = parseFloat(el.getAttribute("data-count") || "0") || 0;
        const plus = el.getAttribute("data-plus") === "true";
        const dur = 1500;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(target * e) + (plus && p === 1 ? "+" : "");
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      const check = () => {
        const h = window.innerHeight;
        reveals = reveals.filter((el) => {
          const top = el.getBoundingClientRect().top;
          if (top < h * 0.9) {
            el.style.opacity = "1";
            el.style.transform = "none";
            return false;
          }
          return true;
        });
        counters = counters.filter((el) => {
          if (el.getBoundingClientRect().top < h * 0.85) {
            runCounter(el);
            return false;
          }
          return true;
        });
      };
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            check();
            ticking = false;
          });
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      const onVis = () => {
        if (!document.hidden) check();
      };
      document.addEventListener("visibilitychange", onVis);
      cleanups.push(() => document.removeEventListener("visibilitychange", onVis));
      check();
      timers.push(setTimeout(check, 120));
      timers.push(setTimeout(check, 400));
      timers.push(setTimeout(check, 900));
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      });
    };

    // ---------- parallax ----------
    const setupParallax = () => {
      const layers = qa<HTMLElement>("[data-parallax]").map((el) => ({
        el,
        speed: parseFloat(el.getAttribute("data-parallax") || "0.1") || 0.1,
        base: el.getBoundingClientRect().top + window.scrollY,
      }));
      let ticking = false;
      const update = () => {
        const y = window.scrollY;
        layers.forEach((l) => {
          const rel = y - l.base + window.innerHeight / 2;
          l.el.style.transform = `translate3d(0, ${rel * l.speed}px, 0)`;
        });
        ticking = false;
      };
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      update();
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    };

    // ---------- typing terminal ----------
    const setupTyping = () => {
      const target = q<HTMLElement>("#nm-term");
      if (!target) return;
      const lines = [
        { t: "$ whoami", c: "var(--accent)" },
        { t: "nodeman · entrepreneur · technologist · educator", c: "var(--mute)" },
        { t: "$ cat mission.txt", c: "var(--accent)" },
        { t: "기술의 가능성을 믿고, 사람의 성장을 돕는다.", c: "var(--mute)" },
        { t: "$ ready_", c: "var(--accent)" },
      ];
      let li = 0;
      let ci = 0;
      const tick = () => {
        if (li >= lines.length) return;
        const line = lines[li];
        if (ci === 0) {
          const span = document.createElement("span");
          span.style.color = line.c;
          span.style.display = "block";
          span.dataset.line = String(li);
          target.appendChild(span);
        }
        const span = target.querySelector<HTMLElement>(`[data-line="${li}"]`);
        if (span) span.textContent = line.t.slice(0, ci + 1);
        ci++;
        if (ci >= line.t.length) {
          li++;
          ci = 0;
          timers.push(setTimeout(tick, 360));
        } else {
          timers.push(setTimeout(tick, 26 + Math.random() * 34));
        }
      };
      timers.push(setTimeout(tick, 700));
    };

    // ---------- clock (KST) ----------
    const setupClock = () => {
      const el = q<HTMLElement>("#nm-clock");
      if (!el) return;
      const tick = () => {
        const now = new Date();
        const kst = new Date(
          now.getTime() + now.getTimezoneOffset() * 60000 + 9 * 3600000
        );
        const p = (n: number) => String(n).padStart(2, "0");
        el.textContent = `${p(kst.getHours())}:${p(kst.getMinutes())}:${p(
          kst.getSeconds()
        )} KST`;
      };
      tick();
      clock = setInterval(tick, 1000);
    };

    // ---------- mouse glow + coords ----------
    const setupMouse = () => {
      const glow = q<HTMLElement>("#nm-glow");
      const coords = q<HTMLElement>("#nm-coords");
      let rafId: number | null = null;
      let mx = 0;
      let my = 0;
      const onMove = (ev: MouseEvent) => {
        mx = ev.clientX;
        my = ev.clientY;
        if (coords)
          coords.textContent = `X ${String(Math.round(mx)).padStart(
            3,
            "0"
          )} · Y ${String(Math.round(my)).padStart(3, "0")}`;
        if (glow && !rafId) {
          rafId = requestAnimationFrame(() => {
            const hero = q<HTMLElement>("#top");
            if (hero) {
              const r = hero.getBoundingClientRect();
              glow.style.left = mx - r.left + "px";
              glow.style.top = my - r.top + "px";
            }
            rafId = null;
          });
        }
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      cleanups.push(() => window.removeEventListener("mousemove", onMove));
    };

    // ---------- timeline scroll progress ----------
    const setupTimeline = () => {
      const wrap = q<HTMLElement>("#nm-timeline");
      const fill = q<HTMLElement>("#nm-timeline-fill");
      if (!wrap || !fill) return;
      const items = Array.from(wrap.querySelectorAll<HTMLElement>("[data-tl]"));
      let ticking = false;
      const update = () => {
        ticking = false;
        const r = wrap.getBoundingClientRect();
        const h = window.innerHeight;
        const start = h * 0.7;
        const end = h * 0.45;
        let p = (start - r.top) / (r.height + (start - end));
        p = Math.max(0, Math.min(1, p));
        fill.style.height = p * 100 + "%";
        const fillBottom = r.top + r.height * p;
        items.forEach((it) => {
          const dot = it.querySelector<HTMLElement>("[data-tl-dot]");
          const ir = it.getBoundingClientRect();
          const active = ir.top <= fillBottom + 6;
          if (dot) {
            dot.style.background = active ? "var(--accent)" : "var(--faint)";
            dot.style.boxShadow = active ? "0 0 10px var(--accent)" : "none";
            dot.style.transform = active ? "scale(1.25)" : "scale(1)";
          }
          it.style.opacity = active ? "1" : "0.45";
        });
      };
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      timers.push(setTimeout(update, 200));
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      });
    };

    // ---------- boot sequence ----------
    const setupBoot = () => {
      const boot = q<HTMLElement>("#nm-boot");
      if (!boot) return;
      let played = false;
      try {
        played = sessionStorage.getItem("nm_booted") === "1";
      } catch {
        /* ignore */
      }
      const title = q<HTMLElement>("#nm-hero-title");
      const glitch = () => {
        if (!title) return;
        title.style.animation = "nmChroma .5s ease-out";
        timers.push(
          setTimeout(() => {
            title.style.animation = "";
          }, 600)
        );
      };
      if (played) {
        boot.style.display = "none";
        timers.push(setTimeout(glitch, 300));
        return;
      }
      const textEl = q<HTMLElement>("#nm-boot-text");
      if (textEl) {
        "NODEMAN".split("").forEach((ch, i) => {
          const s = document.createElement("span");
          s.textContent = ch;
          s.style.display = "inline-block";
          s.style.opacity = "0";
          s.style.color = "var(--text)";
          s.style.textShadow =
            "0 0 24px color-mix(in srgb,var(--accent) 60%,transparent)";
          s.style.animation = `nmBootChar .42s cubic-bezier(.16,1,.3,1) ${i * 0.08}s forwards`;
          textEl.appendChild(s);
        });
      }
      timers.push(
        setTimeout(() => {
          boot.style.opacity = "0";
          glitch();
          timers.push(
            setTimeout(() => {
              boot.style.display = "none";
            }, 560)
          );
          try {
            sessionStorage.setItem("nm_booted", "1");
          } catch {
            /* ignore */
          }
        }, 1450)
      );
    };

    // ---------- galaxy canvas ----------
    const setupGalaxy = () => {
      const cv = q<HTMLCanvasElement>("#nm-galaxy");
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0;
      let H = 0;
      const resize = () => {
        W = cv.clientWidth;
        H = cv.clientHeight;
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize, { passive: true });

      const blue = [80, 140, 246];
      const purple = [150, 110, 246];
      const lerp = (a: number[], b: number[], t: number) =>
        a.map((v, i) => Math.round(v + (b[i] - v) * t));

      const N = window.innerWidth < 768 ? 700 : 1600;
      const arms = 3;
      const spin = 2.6;
      const spread = 0.55;
      const parts: Array<{
        r: number;
        a: number;
        off: number;
        size: number;
        b: number;
      }> = [];
      for (let i = 0; i < N; i++) {
        const r = Math.pow(Math.random(), 1.7);
        const arm = ((i % arms) / arms) * Math.PI * 2;
        const ang = arm + r * spin;
        const jitter = (Math.random() - 0.5) * spread * (0.15 + r);
        parts.push({
          r,
          a: ang + jitter,
          off: (Math.random() - 0.5) * spread * r,
          size: Math.random() * 1.4 + 0.3,
          b: 0.3 + Math.random() * 0.7,
        });
      }
      const stars: Array<{
        x: number;
        y: number;
        s: number;
        ph: number;
        sp: number;
      }> = [];
      const SN = window.innerWidth < 768 ? 120 : 260;
      for (let i = 0; i < SN; i++)
        stars.push({
          x: Math.random(),
          y: Math.random(),
          s: Math.random() * 1.3 + 0.2,
          ph: Math.random() * Math.PI * 2,
          sp: 0.5 + Math.random() * 2,
        });
      let shooters: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
      }> = [];
      let lastShoot = 0;

      const start = performance.now();
      const draw = (now: number) => {
        const t = (now - start) / 1000;
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
        for (const st of stars) {
          const tw = 0.5 + 0.5 * Math.sin(t * st.sp + st.ph);
          ctx.globalAlpha = 0.25 + tw * 0.6;
          ctx.fillStyle = "#cfe0ff";
          ctx.fillRect(st.x * W, st.y * H, st.s, st.s);
        }
        ctx.globalCompositeOperation = "lighter";
        const cx = W * 0.72;
        const cy = H * 0.3;
        const scale = Math.min(W, H) * 0.52;
        const rot = t * 0.045;
        const tilt = 0.42;
        for (const p of parts) {
          const a = p.a + rot;
          const px = cx + Math.cos(a) * p.r * scale;
          const py = cy + Math.sin(a) * p.r * scale * tilt + p.off * scale * 0.3;
          if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
          const col =
            p.r < 0.35
              ? lerp([255, 240, 210], blue, p.r / 0.35)
              : lerp(blue, purple, (p.r - 0.35) / 0.65);
          ctx.globalAlpha = p.b * (1 - p.r * 0.45);
          ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.32);
        g.addColorStop(0, "rgba(200,220,255,.5)");
        g.addColorStop(0.4, "rgba(120,150,250,.18)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, scale * 0.32, 0, Math.PI * 2);
        ctx.fill();

        if (now - lastShoot > 2600 && Math.random() > 0.4) {
          lastShoot = now;
          shooters.push({
            x: Math.random() * W * 0.8,
            y: Math.random() * H * 0.4,
            vx: 3 + Math.random() * 3,
            vy: 1.2 + Math.random() * 1.6,
            life: 1,
          });
        }
        shooters = shooters.filter((s) => s.life > 0);
        for (const s of shooters) {
          s.x += s.vx * 3;
          s.y += s.vy * 3;
          s.life -= 0.018;
          ctx.globalAlpha = Math.max(0, s.life);
          const grd = ctx.createLinearGradient(
            s.x,
            s.y,
            s.x - s.vx * 14,
            s.y - s.vy * 14
          );
          grd.addColorStop(0, "rgba(255,255,255,.9)");
          grd.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = grd;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        galaxyRaf = requestAnimationFrame(draw);
      };
      galaxyRaf = requestAnimationFrame(draw);
      cleanups.push(() => {
        cancelAnimationFrame(galaxyRaf);
        window.removeEventListener("resize", resize);
      });
    };

    setupReveal();
    setupParallax();
    setupTyping();
    setupClock();
    setupMouse();
    setupTimeline();
    if (SHOW_GALAXY) setupGalaxy();
    if (SHOW_BOOT) setupBoot();

    return () => {
      timers.forEach(clearTimeout);
      if (clock) clearInterval(clock);
      cancelAnimationFrame(galaxyRaf);
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    };
  }, []);

  return (
    <div className="nm-root" ref={rootRef}>
      {/* ============ GALAXY BACKDROP ============ */}
      {SHOW_GALAXY && (
        <div className="nm-galaxy-wrap">
          <canvas id="nm-galaxy" />
          <div className="nm-galaxy-vignette" />
        </div>
      )}

      {/* ============ NOISE + SCANLINES ============ */}
      <div className="nm-noise" />
      <div className="nm-scanlines" />

      {/* ============ BOOT SEQUENCE ============ */}
      {SHOW_BOOT && (
        <div id="nm-boot" className="nm-boot">
          <div className="nm-boot-scan" />
          <div id="nm-boot-text" />
          <div className="nm-boot-init">Initializing</div>
          <div className="nm-boot-bar" />
        </div>
      )}

      {/* ============ FIXED HUD ============ */}
      <div className="nm-hud">
        <div className="nm-hud-row">
          <div className="nm-hud-col">
            <span className="nm-hud-city">SEOUL · KR</span>
            <span id="nm-clock">--:--:-- KST</span>
          </div>
          <div className="nm-hud-col right">
            <span>37.5665°N / 126.9780°E</span>
            <span id="nm-coords">X 000 · Y 000</span>
          </div>
        </div>
      </div>

      {/* corner registration marks */}
      <div className="nm-mark tl" />
      <div className="nm-mark tr" />
      <div className="nm-mark bl" />
      <div className="nm-mark br" />

      {/* ============ NAV ============ */}
      <nav className="nm-nav">
        <div className="nm-nav-pill">
          <a href="#top" className="nm-brand">
            <span className="nm-brand-dot" />
            nodeman
          </a>
          <div className="nm-nav-links">
            <a href="#about" className="nm-nav-link">About</a>
            <a href="#roles" className="nm-nav-link">Roles</a>
            <a href="#journey" className="nm-nav-link">Journey</a>
            <a href="#ai" className="nm-nav-link">AI</a>
          </div>
          <a href="#contact" className="nm-connect">connect</a>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section id="top" className="nm-hero">
        {SHOW_GRID && <div data-parallax="0.18" className="nm-hero-grid" />}
        {MOUSE_GLOW && <div id="nm-glow" />}

        <div className="nm-hero-inner">
          <div data-reveal className="nm-reveal nm-eyebrow">
            <span className="nm-eyebrow-line" />
            Personal site · 개인 홈페이지 · v2026
          </div>

          <h1 id="nm-hero-title" data-reveal className="nm-reveal nm-hero-title" style={{ transitionDelay: ".08s" }}>
            nodeman<span className="nm-hero-caret">_</span>
          </h1>

          <div data-reveal className="nm-reveal nm-hero-sub" style={{ transitionDelay: ".18s" }}>
            <div className="nm-hero-roles">
              <span>Entrepreneur</span>
              <span className="nm-sep">·</span>
              <span>Technologist</span>
              <span className="nm-sep">·</span>
              <span>Educator</span>
            </div>
            <p className="nm-hero-desc">
              17년간의 기술 여정을 통해 개발자에서 리더로, 창업가에서 교육자로 끊임없이 진화해왔습니다. Building, leading, and teaching at the edge of technology.
            </p>
          </div>

          {/* terminal */}
          <div data-reveal className="nm-reveal nm-term" style={{ transitionDelay: ".28s" }}>
            <div className="nm-term-bar">
              <span className="nm-dot red" />
              <span className="nm-dot yellow" />
              <span className="nm-dot green" />
              <span className="nm-term-label">~/node-man — zsh</span>
            </div>
            <div className="nm-term-body">
              <div id="nm-term" />
              <span id="nm-term-cursor" />
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div data-reveal className="nm-reveal nm-scroll" style={{ transitionDelay: ".6s" }}>
          <span className="nm-scroll-label">scroll</span>
          <div className="nm-scroll-mouse">
            <span className="nm-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ============ MARQUEE STRIP ============ */}
      <div className="nm-marquee">
        <div className="nm-marquee-track">
          <div className="nm-marquee-group">
            <span>ENTREPRENEUR</span><span className="nm-marquee-star">✳</span>
            <span>TECHNOLOGIST</span><span className="nm-marquee-star">✳</span>
            <span>EDUCATOR</span><span className="nm-marquee-star">✳</span>
            <span>17 YEARS</span><span className="nm-marquee-star">✳</span>
            <span>창업가 · 기술가 · 교육자</span><span className="nm-marquee-star">✳</span>
          </div>
          <div className="nm-marquee-group" aria-hidden="true">
            <span>ENTREPRENEUR</span><span className="nm-marquee-star">✳</span>
            <span>TECHNOLOGIST</span><span className="nm-marquee-star">✳</span>
            <span>EDUCATOR</span><span className="nm-marquee-star">✳</span>
            <span>17 YEARS</span><span className="nm-marquee-star">✳</span>
            <span>창업가 · 기술가 · 교육자</span><span className="nm-marquee-star">✳</span>
          </div>
        </div>
      </div>

      {/* ============ ABOUT ============ */}
      <section id="about" className="nm-section">
        <div data-reveal className="nm-reveal nm-sec-label">
          <span className="num">01</span>
          <span className="rule" />
          <span className="txt">About / 소개</span>
        </div>

        <div className="nm-about-grid">
          <h2 data-reveal className="nm-reveal nm-about-title">
            기술의 가능성을 믿고, 사람의 <span style={{ color: "var(--accent)" }}>성장</span>을 돕습니다.
            <span className="en">Believing in the power of technology, and in helping people grow.</span>
          </h2>
          <div data-reveal className="nm-reveal nm-about-body" style={{ transitionDelay: ".12s" }}>
            <p>17년간의 기술 여정을 통해 개발자에서 리더로, 창업가에서 교육자로 끊임없이 진화해왔습니다.</p>
            <p>From engineer to leader, from founder to educator — technology has been my constant. 기술의 가능성을 믿고, 사람의 성장을 돕는 것이 저의 사명입니다.</p>
          </div>
        </div>

        {/* stats */}
        <div className="nm-stats">
          <div data-reveal className="nm-reveal nm-stat">
            <div className="nm-stat-num accent">
              <span data-count="17" data-plus="true">0</span>
            </div>
            <div className="nm-stat-label">Years · 경력</div>
          </div>
          <div data-reveal className="nm-reveal nm-stat" style={{ transitionDelay: ".1s" }}>
            <div className="nm-stat-num">
              <span data-count="3">0</span>
            </div>
            <div className="nm-stat-label">Current Roles · 현직</div>
          </div>
          <div data-reveal className="nm-reveal nm-stat" style={{ transitionDelay: ".2s" }}>
            <div className="nm-stat-num">∞</div>
            <div className="nm-stat-label">Passion · 열정</div>
          </div>
        </div>
      </section>

      {/* ============ ROLES ============ */}
      <section id="roles" className="nm-section" style={{ padding: "90px 6vw 130px" }}>
        <div data-reveal className="nm-reveal nm-sec-label" style={{ marginBottom: 14 }}>
          <span className="num">02</span>
          <span className="rule" />
          <span className="txt">Current roles / 현재</span>
        </div>
        <h2 data-reveal className="nm-reveal nm-h2">
          What I do<span className="accent">.</span>
        </h2>

        <div className="nm-roles-grid">
          <div data-reveal className="nm-reveal nm-role-card">
            <div className="nm-role-period">2018 — Present</div>
            <div className="nm-role-title">CEO</div>
            <div className="nm-role-org">Startup</div>
            <div className="nm-role-desc">스타트업 창업 및 경영 · Founding &amp; running a startup.</div>
          </div>
          <div data-reveal className="nm-reveal nm-role-card" style={{ transitionDelay: ".1s" }}>
            <div className="nm-role-period">2022 — Present</div>
            <div className="nm-role-title">CTO</div>
            <div className="nm-role-org">Another Startup</div>
            <div className="nm-role-desc">기술 전략 및 개발 총괄 · Leading tech strategy &amp; engineering.</div>
          </div>
          <div data-reveal className="nm-reveal nm-role-card" style={{ transitionDelay: ".2s" }}>
            <div className="nm-role-period">2021 — Present</div>
            <div className="nm-role-title">Professor</div>
            <div className="nm-role-org">University</div>
            <div className="nm-role-desc">ICT 융합학과 겸임교수 · Adjunct professor, ICT convergence.</div>
          </div>
        </div>
      </section>

      {/* ============ JOURNEY ============ */}
      <section id="journey" className="nm-journey">
        <div className="nm-journey-inner">
          <div data-reveal className="nm-reveal nm-sec-label" style={{ marginBottom: 14 }}>
            <span className="num">03</span>
            <span className="rule" />
            <span className="txt">Journey / 여정</span>
          </div>
          <h2 data-reveal className="nm-reveal nm-h2 nm-journey-h2">
            17 years, one timeline<span className="accent">.</span>
          </h2>

          <div id="nm-timeline">
            <div className="nm-tl-track" />
            <div id="nm-timeline-fill" />

            {[
              { date: "2022 — Present", title: "Another Startup · CTO", desc: "기술 리더십 · Technical leadership" },
              { date: "2021 — Present", title: "겸임교수 · Adjunct Professor", desc: "차세대 개발자 양성 · Training the next generation" },
              { date: "2018 — Present", title: "Startup · CEO", desc: "스타트업 창업 및 경영 · Founder & CEO" },
              { date: "2014 — 2018", title: "CTO / 개발총괄", desc: "웹 개발 리드에서 CTO로 성장 · From web lead to CTO" },
              { date: "2012 — 2013", title: "포렌식 연구원 · Forensics Researcher", desc: "디지털 포렌식 연구 · Digital forensics research" },
              { date: "2010 — 2012", title: "BI Developer", desc: "비즈니스 인텔리전스 · Business intelligence" },
              { date: "2008 — 2010", title: "Windows Developer", desc: "C/C++, C#.NET, WPF" },
            ].map((item, i) => (
              <div
                key={item.date + item.title}
                data-tl
                data-reveal
                className="nm-reveal nm-tl-item"
                style={{ transitionDelay: `${i * 0.05}s` }}
              >
                <span data-tl-dot className="nm-tl-dot" />
                <div className="nm-tl-date">{item.date}</div>
                <div className="nm-tl-title">{item.title}</div>
                <div className="nm-tl-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AI ============ */}
      <section id="ai" className="nm-section" style={{ padding: "120px 6vw" }}>
        <div data-reveal className="nm-reveal nm-sec-label" style={{ marginBottom: 14 }}>
          <span className="num">04</span>
          <span className="rule" />
          <span className="txt">AI / 요즘</span>
        </div>
        <h2 data-reveal className="nm-reveal nm-h2" style={{ marginBottom: 12, maxWidth: 900 }}>
          Building with AI, every day<span className="accent">.</span>
        </h2>
        <p data-reveal className="nm-reveal nm-ai-intro" style={{ transitionDelay: ".06s" }}>
          매일 AI와 함께 만듭니다.
        </p>

        <div className="nm-ai-grid">
          {/* left: copy + tags */}
          <div data-reveal className="nm-reveal">
            <p className="nm-ai-copy-lead">
              요즘 저의 개발은 AI와 떼어놓을 수 없습니다. AI 사용량은 그 어느 때보다 많고, 에이전트와 함께 코드를 짜고, 아이디어를 즉시 프로토타입으로 옮깁니다.
            </p>
            <p className="nm-ai-copy-sub">
              These days my workflow runs on AI. I build alongside agents, prototype at the speed of thought, and treat AI as a daily driver — not a gimmick.
            </p>
            <div className="nm-ai-tags">
              <span className="nm-ai-tag">AI Agents</span>
              <span className="nm-ai-tag">Code Generation</span>
              <span className="nm-ai-tag">Rapid Prototyping</span>
              <span className="nm-ai-tag">Pair Programming</span>
              <span className="nm-ai-tag">Daily Driver</span>
            </div>
          </div>

          {/* right: terminal panel with activity meter */}
          <div data-reveal className="nm-reveal nm-ai-panel" style={{ transitionDelay: ".12s" }}>
            <div className="nm-term-bar">
              <span className="nm-dot red" />
              <span className="nm-dot yellow" />
              <span className="nm-dot green" />
              <span className="nm-term-label">ai.log</span>
              <div className="nm-eq">
                <span className="nm-eq-bar" style={{ animation: "nmEq .9s ease-in-out infinite" }} />
                <span className="nm-eq-bar" style={{ animation: "nmEq .7s ease-in-out .15s infinite" }} />
                <span className="nm-eq-bar" style={{ animation: "nmEq 1.1s ease-in-out .05s infinite" }} />
                <span className="nm-eq-bar" style={{ animation: "nmEq .8s ease-in-out .25s infinite" }} />
                <span className="nm-eq-bar" style={{ animation: "nmEq 1s ease-in-out .1s infinite" }} />
              </div>
            </div>
            <div className="nm-ai-body">
              <div className="nm-ai-cmd"><span className="p">$</span> ai --status</div>
              <div className="nm-ai-out">usage: <span className="hl">heavy</span> · 사용량 최상 <span className="on">●</span></div>
              <div className="nm-ai-cmd"><span className="p">$</span> workflow</div>
              <div className="nm-ai-out">agents + me — shipping daily</div>
              <div className="nm-ai-cmd"><span className="p">$</span> uptime</div>
              <div className="nm-ai-out">always-on<span className="nm-ai-caret" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" className="nm-contact">
        {SHOW_GRID && <div data-parallax="0.1" className="nm-contact-grid" />}
        <div className="nm-contact-inner">
          <div data-reveal className="nm-reveal nm-contact-label">05 · Contact / 연락</div>
          <h2 data-reveal className="nm-reveal nm-contact-title">
            Let&apos;s build<br />something<span className="accent">.</span>
          </h2>
          <p data-reveal className="nm-reveal nm-contact-desc" style={{ transitionDelay: ".12s" }}>
            새로운 기회, 협업, 또는 대화를 환영합니다. — Open to new opportunities, collaboration, and conversation.
          </p>
          <div data-reveal className="nm-reveal nm-contact-actions" style={{ transitionDelay: ".2s" }}>
            <a href="https://github.com/node-man" className="nm-btn" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="nm-footer">
        <div className="nm-footer-inner">
          <div className="nm-footer-brand">
            <span className="d" />
            nodeman — © 2026
          </div>
          <span>Designed in the terminal · 터미널에서 디자인됨</span>
        </div>
      </footer>
    </div>
  );
}
