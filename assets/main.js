/* roruizf.com — interactions. No dependencies. */
(() => {
  "use strict";
  const doc = document.documentElement;
  doc.classList.add("js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`; io.observe(el); });
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Nav: border on scroll + active section ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll(".nav__links a")];
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduced) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1100;
        const step = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => { c.textContent = "0"; co.observe(c); });
  }

  /* ---------- Live GitHub stars (falls back to the static numbers) ---------- */
  document.querySelectorAll("[data-repo]").forEach((card) => {
    const b = card.querySelector(".repo__stars b");
    if (!b || !window.fetch) return;
    fetch(`https://api.github.com/repos/${card.dataset.repo}`, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.stargazers_count === "number") b.textContent = d.stargazers_count; })
      .catch(() => {});
  });

  /* ---------- Hero: 8,760-hour carpet plot ---------- */
  const canvas = document.getElementById("carpet");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const DAYS = 365, HOURS = 24;
  const W = canvas.width, H = canvas.height;
  const cw = W / DAYS, ch = H / HOURS;
  const clock = document.getElementById("plotClock");
  const tip = document.getElementById("plotTip");

  // Deterministic PRNG so the plot is the same on every visit.
  let seed = 20260;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Synthetic temperate-climate year: seasonal wave + daily swing + multi-day weather fronts.
  const fronts = [];
  let f = 0;
  for (let d = 0; d < DAYS; d++) { f = f * 0.82 + (rand() - 0.5) * 3.2; fronts.push(f); }
  const T = new Float32Array(DAYS * HOURS);
  for (let d = 0; d < DAYS; d++) {
    const season = 10.8 - 8.2 * Math.cos((2 * Math.PI * (d - 18)) / 365);
    const swing = 3.2 + 2.6 * Math.max(0, Math.sin((2 * Math.PI * (d - 80)) / 365));
    const cloud = 0.6 + rand() * 0.6;
    for (let h = 0; h < HOURS; h++) {
      const daily = -Math.cos((2 * Math.PI * (h - 3)) / 24) * swing * cloud;
      T[d * HOURS + h] = season + daily + fronts[d] + (rand() - 0.5) * 0.8;
    }
  }

  const stops = [[29, 60, 143], [43, 123, 195], [68, 180, 166], [242, 193, 78], [236, 122, 44], [200, 48, 42]];
  const TMIN = -5, TMAX = 30;
  const color = (t) => {
    let x = Math.max(0, Math.min(1, (t - TMIN) / (TMAX - TMIN))) * (stops.length - 1);
    const i = Math.min(Math.floor(x), stops.length - 2), k = x - i;
    const a = stops[i], b = stops[i + 1];
    return `rgb(${a[0] + (b[0] - a[0]) * k | 0},${a[1] + (b[1] - a[1]) * k | 0},${a[2] + (b[2] - a[2]) * k | 0})`;
  };

  const drawDay = (d) => {
    for (let h = 0; h < HOURS; h++) {
      ctx.fillStyle = color(T[d * HOURS + h]);
      // hour 0 at the bottom, like a classic carpet plot
      ctx.fillRect(Math.floor(d * cw), Math.floor(H - (h + 1) * ch), Math.ceil(cw), Math.ceil(ch));
    }
  };

  const setClock = (d) => { if (clock) clock.textContent = `t = ${((d + 1) * 24).toLocaleString("en-US")} h`; };

  if (reduced) {
    for (let d = 0; d < DAYS; d++) drawDay(d);
    setClock(DAYS - 1);
  } else {
    let day = 0, started = false;
    const run = () => {
      const perFrame = 6;
      for (let i = 0; i < perFrame && day < DAYS; i++, day++) drawDay(day);
      setClock(day - 1);
      if (day < DAYS) requestAnimationFrame(run);
    };
    const start = () => { if (!started) { started = true; setTimeout(() => requestAnimationFrame(run), 350); } };
    if ("IntersectionObserver" in window) {
      const po = new IntersectionObserver((e) => { if (e[0].isIntersecting) { start(); po.disconnect(); } }, { threshold: 0.3 });
      po.observe(canvas);
    } else start();
  }

  // Tooltip: read any hour of the year.
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateOf = (d) => { const dt = new Date(Date.UTC(2026, 0, 1 + d)); return `${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`; };
  const move = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const px = (clientX - r.left) / r.width, py = (clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) { tip.hidden = true; return; }
    const d = Math.min(DAYS - 1, Math.floor(px * DAYS));
    const h = Math.min(HOURS - 1, Math.floor((1 - py) * HOURS));
    tip.textContent = `${dateOf(d)} · ${String(h).padStart(2, "0")}:00 · ${T[d * HOURS + h].toFixed(1)} °C`;
    tip.style.left = `${canvas.offsetLeft + px * r.width}px`;
    tip.style.top = `${canvas.offsetTop + py * r.height}px`;
    tip.hidden = false;
  };
  canvas.addEventListener("pointermove", (e) => move(e.clientX, e.clientY));
  canvas.addEventListener("pointerleave", () => { tip.hidden = true; });
})();
