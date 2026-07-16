/* Secret Room Media — сбор событий аналитики (Supabase) */
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

  function utmParams() {
    const p = new URLSearchParams(location.search);
    const out = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(k => {
      const v = p.get(k);
      if (v) out[k] = v.slice(0, 120);
    });
    return out;
  }

  function networkFromHost(host) {
    const h = (host || "").toLowerCase();
    if (/t\.me|telegram/.test(h)) return "telegram";
    if (/vk\.com|vkontakte/.test(h)) return "vk";
    if (/twitter\.|x\.com/.test(h)) return "x";
    if (/facebook\.|fb\.com/.test(h)) return "facebook";
    if (/instagram/.test(h)) return "instagram";
    return "other";
  }

  function sourceGroup(ref, utm) {
    const src = (utm.utm_source || "").toLowerCase();
    const med = (utm.utm_medium || "").toLowerCase();
    if (src || med) {
      if (/telegram|t\.me|vk|twitter|x_|facebook|instagram|social|tg/.test(src + " " + med) || med === "social") return "social";
      if (/cpc|ppc|ads|paid/.test(med)) return "referral";
      if (/organic|search/.test(med) || /google|yandex|bing/.test(src)) return "search";
      if (/email|newsletter/.test(med)) return "referral";
    }
    if (!ref) return "direct";
    try {
      const u = new URL(ref);
      const host = u.hostname.replace(/^www\./, "");
      const here = location.hostname.replace(/^www\./, "");
      if (host === here || (host.endsWith("github.io") && here.endsWith("github.io"))) {
        const file = u.pathname.split("/").pop() || "";
        if (!file || file === "index.html" || u.pathname.endsWith("/")) return "main";
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

  function flush() {
    flushTimer = null;
    if (!queue.length) return;
    const batch = queue.splice(0, queue.length);
    const body = JSON.stringify(batch.length === 1 ? batch[0] : batch);
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

  function send(payload) {
    queue.push(payload);
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 400);
  }

  function track(eventType, extra) {
    const meta = pageMeta();
    const ref = document.referrer || "";
    const utm = utmParams();
    const baseMeta = { ...utm, ...(extra?.meta || {}) };
    send({
      event_type: eventType,
      page_path: location.pathname + location.search,
      article_id: meta.articleId,
      article_title: meta.articleTitle,
      author: meta.author,
      visitor_id: uid("srm_visitor_id"),
      session_id: getSessionId(),
      referrer: ref.slice(0, 500),
      source_group: sourceGroup(ref, utm),
      scroll_pct: extra?.scroll_pct ?? null,
      duration_ms: extra?.duration_ms ?? null,
      meta: baseMeta
    });
  }

  function trackSocial(network, href) {
    track("social", { meta: { network: network || "other", href: (href || "").slice(0, 300) } });
  }

  track("pageview");

  /* Дочитывание: нижняя граница блока материала */
  const seenScroll = new Set();
  let readEndSent = false;

  function contentScrollPct() {
    const el = document.querySelector(".article-body");
    if (el) {
      const rect = el.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const bottom = top + el.offsetHeight;
      const viewBottom = window.scrollY + window.innerHeight;
      const span = Math.max(1, bottom - top - window.innerHeight * 0.15);
      const progressed = viewBottom - top;
      return Math.max(0, Math.min(100, Math.round((progressed / span) * 100)));
    }
    const doc = document.documentElement;
    const body = document.body;
    const h = Math.max(doc.scrollHeight, body.scrollHeight) - window.innerHeight;
    if (h <= 0) return 100;
    return Math.min(100, Math.round((window.scrollY / h) * 100));
  }

  function onScroll() {
    const pct = contentScrollPct();
    [25, 50, 75, 100].forEach(m => {
      if (pct >= m && !seenScroll.has(m)) {
        seenScroll.add(m);
        track("scroll", { scroll_pct: m });
      }
    });
    if (pct >= 95 && !readEndSent) {
      readEndSent = true;
      track("read_end", { scroll_pct: 100 });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  setTimeout(onScroll, 900);

  let active = true;
  document.addEventListener("visibilitychange", () => {
    active = document.visibilityState === "visible";
  });
  setInterval(() => {
    if (!active) return;
    getSessionId();
    track("heartbeat", { duration_ms: HEARTBEAT_MS });
  }, HEARTBEAT_MS);

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !a.href) return;
    try {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) {
        if (/t\.me|telegram|twitter|x\.com|facebook|vk\.com|instagram/i.test(url.hostname)) {
          trackSocial(networkFromHost(url.hostname), url.href);
        }
        return;
      }
      const file = url.pathname.split("/").pop() || "";
      if (["article.html", "articles.html", "services.html", "calendar.html", "index.html", ""].includes(file) || url.pathname.endsWith("/")) {
        if (file !== (location.pathname.split("/").pop() || "")) {
          track("click_through", { meta: { href: url.pathname + url.search } });
        }
      }
    } catch (_) {}
  });

  window.SRM_TRACK = { track, trackSocial };
})();
