/* Пульс — дашборд аналитики Secret Room Media */
(function () {
  const SOURCE_LABELS = {
    direct: "Прямые заходы",
    referral: "С других сайтов",
    search: "Поиск",
    social: "Соцсети",
    internal: "Внутренние страницы",
    main: "С главной",
    other: "Другое"
  };

  function $(id) { return document.getElementById(id); }

  function fmtNum(n) {
    n = Math.round(Number(n) || 0);
    return n.toLocaleString("ru-RU");
  }

  function fmtPct(n) {
    if (n == null || Number.isNaN(n)) return "—";
    return Math.round(n) + "%";
  }

  function fmtTime(ms) {
    const s = Math.max(0, Math.round((Number(ms) || 0) / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function rangeBounds(preset, fromEl, toEl) {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (preset === "week") start.setDate(start.getDate() - 6);
    else if (preset === "month") start.setDate(start.getDate() - 29);
    else if (preset === "custom") {
      if (fromEl?.value) start = new Date(fromEl.value + "T00:00:00");
      if (toEl?.value) {
        end.setTime(new Date(toEl.value + "T23:59:59").getTime());
      }
    }
    return { start, end };
  }

  async function fetchEvents(start, end) {
    const cfg = window.SRM_SUPABASE;
    if (!cfg?.url) return [];
    const url = `${cfg.url}/rest/v1/media_analytics_events?created_at=gte.${start.toISOString()}&created_at=lte.${end.toISOString()}&select=*&order=created_at.desc&limit=5000`;
    const res = await fetch(url, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey
      }
    });
    if (!res.ok) throw new Error("analytics fetch " + res.status);
    return res.json();
  }

  function aggregate(events, start, end) {
    const pageviews = events.filter(e => e.event_type === "pageview");
    const visitors = new Set(pageviews.map(e => e.visitor_id));
    const sessions = new Set(pageviews.map(e => e.session_id));
    const heartbeats = events.filter(e => e.event_type === "heartbeat");
    const readEnds = events.filter(e => e.event_type === "read_end");
    const clickThrough = events.filter(e => e.event_type === "click_through");
    const social = events.filter(e => e.event_type === "social");

    const avgTime = heartbeats.length
      ? (heartbeats.reduce((s, e) => s + (e.duration_ms || 15000), 0) / Math.max(1, sessions.size))
      : 0;

    const articlePageviews = pageviews.filter(e => e.article_id);
    const readRate = articlePageviews.length
      ? (readEnds.length / articlePageviews.length) * 100
      : 0;
    const ctr = pageviews.length ? (clickThrough.length / pageviews.length) * 100 : 0;

    // publications
    const byArticle = {};
    pageviews.forEach(e => {
      const key = e.article_id || e.page_path || "page";
      if (!byArticle[key]) {
        byArticle[key] = {
          id: e.article_id,
          title: e.article_title || e.page_path || "Страница",
          author: e.author || "—",
          views: 0,
          social: 0,
          reads: 0
        };
      }
      byArticle[key].views++;
    });
    social.forEach(e => {
      const key = e.article_id || e.page_path || "page";
      if (byArticle[key]) byArticle[key].social++;
    });
    readEnds.forEach(e => {
      const key = e.article_id || e.page_path || "page";
      if (byArticle[key]) byArticle[key].reads++;
    });
    // enrich from store
    if (window.SRM_STORE) {
      Object.values(byArticle).forEach(row => {
        if (!row.id) return;
        const a = SRM_STORE.byId(row.id);
        if (a) {
          row.title = a.title;
          row.author = a.author || row.author;
          row.date = a.date;
        }
      });
    }
    const publications = Object.values(byArticle).sort((a, b) => b.views - a.views);

    // sources
    const sources = {};
    pageviews.forEach(e => {
      const g = e.source_group || "other";
      sources[g] = (sources[g] || 0) + 1;
    });
    const sourceRows = Object.entries(sources)
      .map(([k, v]) => ({ key: k, label: SOURCE_LABELS[k] || k, count: v, pct: pageviews.length ? (v / pageviews.length) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);

    // authors
    const authors = {};
    pageviews.forEach(e => {
      const a = e.author || "Без автора";
      authors[a] = (authors[a] || 0) + 1;
    });
    const authorRows = Object.entries(authors)
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views);

    // sparkline by day
    const days = {};
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);
    while (cursor <= endDay) {
      days[cursor.toISOString().slice(0, 10)] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }
    pageviews.forEach(e => {
      const d = String(e.created_at || "").slice(0, 10);
      if (d in days) days[d]++;
    });
    const spark = Object.entries(days).map(([date, count]) => ({ date, count }));

    return {
      pageviews: pageviews.length,
      uniques: visitors.size,
      sessions: sessions.size,
      avgTime,
      readRate,
      ctr,
      social: social.length,
      publications,
      sourceRows,
      authorRows,
      spark,
      empty: !events.length
    };
  }

  function sparkSVG(points) {
    if (!points.length) return "";
    const w = 320, h = 56, pad = 4;
    const max = Math.max(1, ...points.map(p => p.count));
    const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
    const coords = points.map((p, i) => {
      const x = pad + i * step;
      const y = h - pad - (p.count / max) * (h - pad * 2);
      return `${x},${y}`;
    });
    return `<svg class="pulse-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke="currentColor" stroke-width="2.5" points="${coords.join(" ")}"></polyline>
    </svg>`;
  }

  function render(data) {
    $("pulse-kpi").innerHTML = [
      ["Просмотры", fmtNum(data.pageviews), ""],
      ["Уники", fmtNum(data.uniques), ""],
      ["Сессии", fmtNum(data.sessions), ""],
      ["Среднее время", fmtTime(data.avgTime), ""],
      ["Дочитали", fmtPct(data.readRate), ""],
      ["Перешли дальше", fmtPct(data.ctr), ""],
      ["Соц. действия", fmtNum(data.social), ""]
    ].map(([label, val]) => `
      <div class="pulse-kpi-card">
        <div class="pulse-kpi-label">${label}</div>
        <div class="pulse-kpi-val">${val}</div>
      </div>`).join("");

    $("pulse-spark-wrap").innerHTML = data.spark.length
      ? sparkSVG(data.spark) + `<div class="pulse-spark-meta">Динамика просмотров за период</div>`
      : `<div class="pulse-empty-inline">Пока нет данных за период</div>`;

    const maxSrc = data.sourceRows[0]?.count || 1;
    $("pulse-sources").innerHTML = data.sourceRows.length
      ? data.sourceRows.map(r => `
        <div class="pulse-row">
          <div class="pulse-row-main">
            <span class="pulse-row-title">${r.label}</span>
            <span class="pulse-row-meta">${fmtPct(r.pct)}</span>
          </div>
          <div class="pulse-bar"><i style="width:${Math.max(4, r.count / maxSrc * 100)}%"></i></div>
          <div class="pulse-row-num">${fmtNum(r.count)}</div>
        </div>`).join("")
      : `<div class="pulse-empty-inline">Нет данных по источникам</div>`;

    $("pulse-pubs").innerHTML = data.publications.length
      ? `<div class="pulse-table">
          <div class="pulse-thead"><span>Материал</span><span>Просмотры</span><span>Соц.</span></div>
          ${data.publications.slice(0, 12).map(p => `
            <div class="pulse-trow">
              <div>
                <div class="pulse-row-title">${p.title}</div>
                <div class="pulse-row-meta">${p.author}${p.date ? " · " + srmFmtDate(p.date) : ""}</div>
              </div>
              <div class="pulse-row-num">${fmtNum(p.views)}</div>
              <div class="pulse-row-num">${fmtNum(p.social)}</div>
            </div>`).join("")}
        </div>`
      : `<div class="pulse-empty-inline">Пока нет просмотров материалов</div>`;

    $("pulse-authors").innerHTML = data.authorRows.length
      ? data.authorRows.slice(0, 8).map(a => `
        <div class="pulse-row">
          <div class="pulse-row-main"><span class="pulse-row-title">${a.name}</span></div>
          <div class="pulse-row-num">${fmtNum(a.views)}</div>
        </div>`).join("")
      : `<div class="pulse-empty-inline">Нет данных по авторам</div>`;

    $("pulse-note").textContent = data.empty
      ? "Данных ещё нет — походи по сайту (главная, статьи), затем обнови Пульс."
      : "Считаем своим трекером: просмотры, уники, сессии, скролл, клики и соц. переходы.";
  }

  async function refresh() {
    const preset = document.querySelector(".pulse-range button.active")?.dataset.range || "week";
    const { start, end } = rangeBounds(preset, $("pulse-from"), $("pulse-to"));
    $("pulse-status").textContent = "Обновляю…";
    try {
      const events = await fetchEvents(start, end);
      render(aggregate(events, start, end));
      $("pulse-status").textContent = "Обновлено · " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      $("pulse-status").textContent = "Ошибка загрузки";
      $("pulse-note").textContent = "Не удалось получить данные: " + e.message;
    }
  }

  function initPulseUI() {
    if (!$("pulse-root")) return;
    document.querySelectorAll(".pulse-range button").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".pulse-range button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const custom = btn.dataset.range === "custom";
        $("pulse-custom").hidden = !custom;
        if (!custom) refresh();
      });
    });
    $("pulse-apply")?.addEventListener("click", refresh);
    $("pulse-refresh")?.addEventListener("click", refresh);
    refresh();
  }

  window.SRM_PULSE = { init: initPulseUI, refresh };
})();
