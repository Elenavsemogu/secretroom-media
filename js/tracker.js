/* Secret Room Media — лёгкий трекер аналитики → Supabase */
(function () {
  const cfg = window.SRM_SUPABASE;
  if (!cfg?.url || !cfg?.anonKey) return;

  const SESSION_MS = 30 * 60 * 1000;
  const HEARTBEAT_MS = 15000;
  const ENDPOINT = cfg.url + "/rest/v1/media_analytics_events";

  function uid(key) {
    try {
      let v = localStorage.getItem(key);
      if (!v) {
        v = (crypto.randomUUID && crypto.randomUUID()) || ("v-" + Date.now() + "-" + Math.random().toString(16).slice(2));
        localStorage.setItem(key, v);
      }
      return v;
    } catch (_) {
      return "anon-" + Date.now();
    }
  }

  function getSessionId() {
    const KEY = "srm_session_id";
    const TS = "srm_session_ts";
    const now = Date.now();
    try {
      const prev = Number(sessionStorage.getItem(TS) || 0);
      let sid = sessionStorage.getItem(KEY);
      if (!sid || !prev || now - prev > SESSION_MS) {
        sid = (crypto.randomUUID && crypto.randomUUID()) || ("s-" + now);
        sessionStorage.setItem(KEY, sid);
      }
      sessionStorage.setItem(TS, String(now));
      return sid;
    } catch (_) {
      return "s-" + now;
    }
  }

  function sourceGroup(ref) {
    if (!ref) return "direct";
    try {
      const u = new URL(ref);
      const host = u.hostname.replace(/^www\./, "");
      const here = location.hostname.replace(/^www\./, "");
      if (host === here || host.endsWith("github.io") && here.endsWith("github.io")) {
        if (u.pathname.endsWith("index.html") || u.pathname.endsWith("/") || !u.pathname.split("/").pop()) return "main";
        return "internal";
      }
      if (/google\.|yandex\.|bing\.|duckduckgo\.|yahoo\./i.test(host)) return "search";
      if (/t\.me|telegram|twitter|x\.com|facebook|instagram|linkedin|vk\.com|tiktok/i.test(host)) return "social";
      return "referral";
    } catch (_) {
      return "other";
    }
  }

  function pageMeta() {
    const params = new URLSearchParams(location.search);
    const articleId = params.get("id") || null;
    let articleTitle = null;
    let author = null;
    if (articleId && window.SRM_STORE) {
      const a = SRM_STORE.byId(articleId);
      if (a) {
        articleTitle = a.title;
        author = a.author || "Secret Room";
      }
    }
    if (!articleTitle) {
      const h1 = document.querySelector("h1");
      articleTitle = h1 ? h1.textContent.trim().slice(0, 160) : document.title;
    }
    return { articleId, articleTitle, author };
  }

  const queue = [];
  let flushTimer = null;

  function send(payload) {
    queue.push(payload);
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 400);
  }

  function flush() {
    flushTimer = null;
    if (!queue.length) return;
    const batch = queue.splice(0, queue.length);
    const body = JSON.stringify(batch.length === 1 ? batch[0] : batch);
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        // sendBeacon can't set auth headers reliably — use fetch keepalive
      }
    } catch (_) {}
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey,
        Prefer: "return=minimal"
      },
      body,
      keepalive: true
    }).catch(() => {});
  }

  function track(eventType, extra) {
    const meta = pageMeta();
    const ref = document.referrer || "";
    send({
      event_type: eventType,
      page_path: location.pathname + location.search,
      article_id: meta.articleId,
      article_title: meta.articleTitle,
      author: meta.author,
      visitor_id: uid("srm_visitor_id"),
      session_id: getSessionId(),
      referrer: ref.slice(0, 500),
      source_group: sourceGroup(ref),
      scroll_pct: extra?.scroll_pct ?? null,
      duration_ms: extra?.duration_ms ?? null,
      meta: extra?.meta || {}
    });
  }

  // pageview
  track("pageview");

  // legacy localStorage counter for articles
  const params = new URLSearchParams(location.search);
  const aid = params.get("id");
  if (aid && window.SRM_STORE && /article\.html$/i.test(location.pathname)) {
    // article.js already tracks — don't double localStorage; only server events here
  }

  // scroll depth
  const seen = new Set();
  function onScroll() {
    const doc = document.documentElement;
    const body = document.body;
    const h = Math.max(doc.scrollHeight, body.scrollHeight) - window.innerHeight;
    if (h <= 0) return;
    const pct = Math.min(100, Math.round((window.scrollY / h) * 100));
    [25, 50, 75, 100].forEach(m => {
      if (pct >= m && !seen.has(m)) {
        seen.add(m);
        track("scroll", { scroll_pct: m });
        if (m === 100) track("read_end", { scroll_pct: 100 });
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  setTimeout(onScroll, 800);

  // time on page
  let started = Date.now();
  let active = true;
  document.addEventListener("visibilitychange", () => {
    active = document.visibilityState === "visible";
    if (active) started = Date.now();
  });
  setInterval(() => {
    if (!active) return;
    getSessionId(); // touch session
    track("heartbeat", { duration_ms: HEARTBEAT_MS });
  }, HEARTBEAT_MS);

  // click-through to other site pages
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !a.href) return;
    try {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) {
        if (/t\.me|telegram|twitter|x\.com|facebook|vk\.com/i.test(url.hostname)) {
          track("social", { meta: { href: url.href.slice(0, 300) } });
        }
        return;
      }
      const file = url.pathname.split("/").pop() || "";
      if (file === "article.html" || file === "articles.html" || file === "services.html" || file === "calendar.html") {
        track("click_through", { meta: { href: url.pathname + url.search } });
      }
    } catch (_) {}
  });

  window.SRM_TRACK = { track };
})();
