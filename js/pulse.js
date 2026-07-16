/* Пульс — полноценный дашборд аналитики Secret Room Media */
(function () {
  const SOURCE_META = {
    direct: { label: "Прямые заходы", hint: "Ввели адрес сами или из закладок", ico: "🚀", color: "var(--yellow)" },
    referral: { label: "С других сайтов", hint: "Переходы по внешним ссылкам", ico: "🔗", color: "var(--lime)" },
    search: { label: "Поиск", hint: "Google, Яндекс и другие", ico: "🔍", color: "var(--blue)" },
    social: { label: "Соцсети", hint: "Telegram, X, Facebook и т.п.", ico: "📱", color: "var(--pink)" },
    internal: { label: "Внутри сайта", hint: "Клики с других страниц медиа", ico: "🏠", color: "#ddd" },
    main: { label: "С главной", hint: "Зашли через главную страницу", ico: "🎯", color: "var(--yellow)" },
    other: { label: "Другое", hint: "Не определили источник", ico: "·", color: "#ccc" }
  };

  const KPI_META = [
    { key: "pageviews", label: "Просмотры страниц", hint: "Сколько раз открывали страницы (с повторами)", ico: "👁", tone: "y" },
    { key: "uniques", label: "Уникальные люди", hint: "Сколько разных посетителей (по cookie)", ico: "👤", tone: "l" },
    { key: "sessions", label: "Сессии", hint: "Отдельные визиты (пауза > 30 мин = новая)", ico: "📈", tone: "w" },
    { key: "avgTime", label: "Среднее время", hint: "Сколько в среднем сидят на материале", ico: "⏳", tone: "p" },
    { key: "readRate", label: "Дочитали до конца", hint: "Доскроллили статью до низа", ico: "📜", tone: "w" },
    { key: "ctr", label: "Перешли дальше", hint: "Кликнули на другой материал/раздел", ico: "🔗", tone: "w" },
    { key: "social", label: "Соц. действия", hint: "Клики в Telegram / соцсети с сайта", ico: "📣", tone: "b" }
  ];

  function $(id) { return document.getElementById(id); }

  function fmtNum(n) {
    return Math.round(Number(n) || 0).toLocaleString("ru-RU");
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

  function fmtDelta(cur, prev) {
    if (prev == null || prev === 0) {
      if (!cur) return { text: "—", cls: "flat" };
      return { text: "new", cls: "up" };
    }
    const pct = ((cur - prev) / prev) * 100;
    if (Math.abs(pct) < 0.5) return { text: "0%", cls: "flat" };
    const sign = pct > 0 ? "+" : "";
    return { text: sign + Math.round(pct) + "%", cls: pct > 0 ? "up" : "down" };
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
      if (toEl?.value) end.setTime(new Date(toEl.value + "T23:59:59").getTime());
    }
    const ms = end - start;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - ms);
    return { start, end, prevStart, prevEnd };
  }

  function periodLabel(start, end) {
    const opts = { day: "numeric", month: "short" };
    return start.toLocaleDateString("ru-RU", opts) + " — " + end.toLocaleDateString("ru-RU", opts);
  }

  async function fetchEvents(start, end) {
    const cfg = window.SRM_SUPABASE;
    if (!cfg?.url) return [];
    const url = `${cfg.url}/rest/v1/media_analytics_events?created_at=gte.${start.toISOString()}&created_at=lte.${end.toISOString()}&select=*&order=created_at.desc&limit=8000`;
    const res = await fetch(url, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey
      }
    });
    if (!res.ok) throw new Error("analytics fetch " + res.status);
    return res.json();
  }

  function summarize(events, start, end) {
    const pageviews = events.filter(e => e.event_type === "pageview");
    const visitors = new Set(pageviews.map(e => e.visitor_id));
    const sessions = new Set(pageviews.map(e => e.session_id));
    const heartbeats = events.filter(e => e.event_type === "heartbeat");
    const readEnds = events.filter(e => e.event_type === "read_end");
    const clickThrough = events.filter(e => e.event_type === "click_through");
    const social = events.filter(e => e.event_type === "social");

    const avgTime = heartbeats.length
      ? heartbeats.reduce((s, e) => s + (e.duration_ms || 15000), 0) / Math.max(1, sessions.size)
      : 0;

    const articlePageviews = pageviews.filter(e => e.article_id);
    const readRate = articlePageviews.length ? (readEnds.length / articlePageviews.length) * 100 : 0;
    const ctr = pageviews.length ? (clickThrough.length / pageviews.length) * 100 : 0;

    const byArticle = {};
    pageviews.forEach(e => {
      const key = e.article_id || e.page_path || "page";
      if (!byArticle[key]) {
        byArticle[key] = {
          id: e.article_id,
          title: e.article_title || e.page_path || "Страница",
          author: e.author || "—",
          views: 0, social: 0, reads: 0
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
    if (window.SRM_STORE) {
      Object.values(byArticle).forEach(row => {
        if (!row.id) return;
        const a = SRM_STORE.byId(row.id);
        if (a) {
          row.title = a.title;
          row.author = a.author || row.author;
          row.date = a.date;
          row.accent = a.accent || "yellow";
          row.emoji = a.emoji || "📰";
        }
      });
    }
    const publications = Object.values(byArticle).sort((a, b) => b.views - a.views);

    const sources = {};
    pageviews.forEach(e => {
      const g = e.source_group || "other";
      sources[g] = (sources[g] || 0) + 1;
    });
    const sourceRows = Object.entries(sources)
      .map(([k, v]) => ({
        key: k,
        ...(SOURCE_META[k] || SOURCE_META.other),
        count: v,
        pct: pageviews.length ? (v / pageviews.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    const authors = {};
    pageviews.forEach(e => {
      const a = e.author || "Без автора";
      authors[a] = (authors[a] || 0) + 1;
    });
    const authorRows = Object.entries(authors)
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views);

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

  function chartHTML(points) {
    if (!points.length) {
      return `<div class="pulse-empty">
        <div class="pulse-empty-ico">📡</div>
        <strong>Пока тихо</strong>
        <p>Открой пару страниц сайта — график и цифры появятся здесь.</p>
      </div>`;
    }
    const w = 640, h = 180, padX = 12, padY = 18;
    const max = Math.max(1, ...points.map(p => p.count));
    const step = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;
    const coords = points.map((p, i) => {
      const x = padX + i * step;
      const y = h - padY - (p.count / max) * (h - padY * 2);
      return [x, y, p];
    });
    const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
    const area = `${padX},${h - padY} ${line} ${coords[coords.length - 1][0]},${h - padY}`;
    const labels = points.length <= 14
      ? coords.map(([x, , p], i) => {
          if (points.length > 8 && i % 2) return "";
          const d = new Date(p.date + "T00:00:00");
          const lab = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
          return `<text x="${x}" y="${h - 2}" text-anchor="middle" class="pulse-chart-lab">${lab}</text>`;
        }).join("")
      : "";
    const peak = Math.max(...points.map(p => p.count));
    const peakDay = points.find(p => p.count === peak);

    return `
      <div class="pulse-chart-frame">
        <svg class="pulse-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2E39F7" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#2E39F7" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line x1="${padX}" y1="${h / 2}" x2="${w - padX}" y2="${h / 2}" class="pulse-gridline"/>
          <polygon fill="url(#pulseFill)" points="${area}"></polygon>
          <polyline fill="none" stroke="#2E39F7" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="${line}"></polyline>
          ${coords.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#F5DA0F" stroke="#1B1B1B" stroke-width="1.5"/>`).join("")}
          ${labels}
        </svg>
      </div>
      <div class="pulse-chart-foot">
        <span>Пик: <strong>${fmtNum(peak)}</strong> · ${peakDay ? new Date(peakDay.date + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : "—"}</span>
        <span>Всего дней в периоде: <strong>${points.length}</strong></span>
      </div>`;
  }

  function render(cur, prev) {
    $("pulse-kpi").innerHTML = KPI_META.map(meta => {
      let val = cur[meta.key];
      let prevVal = prev[meta.key];
      let display = val;
      if (meta.key === "avgTime") {
        display = fmtTime(val);
        // delta on seconds
        const d = fmtDelta(val, prevVal);
        return kpiCard(meta, display, d);
      }
      if (meta.key === "readRate" || meta.key === "ctr") {
        display = fmtPct(val);
        const d = fmtDelta(val, prevVal);
        return kpiCard(meta, display, d);
      }
      display = fmtNum(val);
      return kpiCard(meta, display, fmtDelta(val, prevVal));
    }).join("");

    $("pulse-spark-wrap").innerHTML = chartHTML(cur.spark);

    const maxSrc = cur.sourceRows[0]?.count || 1;
    $("pulse-sources").innerHTML = cur.sourceRows.length
      ? cur.sourceRows.map(r => `
        <div class="pulse-src">
          <div class="pulse-src-ico" style="background:${r.color}">${r.ico}</div>
          <div class="pulse-src-body">
            <div class="pulse-src-top">
              <strong>${r.label}</strong>
              <span class="pulse-src-num">${fmtNum(r.count)}</span>
            </div>
            <div class="pulse-src-hint">${r.hint} · ${fmtPct(r.pct)}</div>
            <div class="pulse-bar"><i style="width:${Math.max(6, r.count / maxSrc * 100)}%;background:${r.color}"></i></div>
          </div>
        </div>`).join("")
      : emptyBlock("Пока нет переходов — источники появятся после визитов");

    const maxPub = cur.publications[0]?.views || 1;
    $("pulse-pubs").innerHTML = cur.publications.length
      ? `<div class="pulse-pubs-list">
          ${cur.publications.slice(0, 10).map((p, i) => `
            <a class="pulse-pub" href="${p.id ? `article.html?id=${p.id}` : "#"}" ${p.id ? 'target="_blank" rel="noopener"' : 'onclick="return false"'}>
              <div class="pulse-pub-rank">${i + 1}</div>
              <div class="pulse-pub-thumb" style="background:var(--${p.accent || "yellow"})">${p.emoji || "📰"}</div>
              <div class="pulse-pub-body">
                <div class="pulse-pub-title">${esc(p.title)}</div>
                <div class="pulse-pub-meta">${esc(p.author)}${p.date ? " · " + srmFmtDate(p.date) : ""}</div>
                <div class="pulse-bar slim"><i style="width:${Math.max(6, p.views / maxPub * 100)}%"></i></div>
              </div>
              <div class="pulse-pub-stats">
                <div><span>👁</span><strong>${fmtNum(p.views)}</strong></div>
                <div><span>📣</span><strong>${fmtNum(p.social)}</strong></div>
                <div><span>📜</span><strong>${fmtNum(p.reads)}</strong></div>
              </div>
            </a>`).join("")}
          <div class="pulse-legend">👁 просмотры · 📣 соц. клики · 📜 дочитали</div>
        </div>`
      : emptyBlock("Материалы появятся, когда кто-то откроет статьи");

    const maxAuth = cur.authorRows[0]?.views || 1;
    $("pulse-authors").innerHTML = cur.authorRows.length
      ? cur.authorRows.slice(0, 8).map((a, i) => `
        <div class="pulse-author">
          <div class="pulse-author-rank">${i + 1}</div>
          <div class="pulse-author-body">
            <strong>${esc(a.name)}</strong>
            <div class="pulse-bar slim"><i style="width:${Math.max(6, a.views / maxAuth * 100)}%"></i></div>
          </div>
          <div class="pulse-author-num">${fmtNum(a.views)}</div>
        </div>`).join("")
      : emptyBlock("Авторы появятся вместе с просмотрами статей");

    $("pulse-note").textContent = cur.empty
      ? "Данных ещё нет. Открой главную и 1–2 статьи на сайте, вернись сюда и нажми «Обновить»."
      : "Считаем своим трекером Secret Room. Сравнение «↑ / ↓» — с таким же предыдущим периодом.";
  }

  function kpiCard(meta, display, delta) {
    return `
      <article class="pulse-kpi-card tone-${meta.tone}">
        <div class="pulse-kpi-top">
          <span class="pulse-kpi-ico">${meta.ico}</span>
          <span class="pulse-delta ${delta.cls}">${delta.text}</span>
        </div>
        <div class="pulse-kpi-val">${display}</div>
        <div class="pulse-kpi-label">${meta.label}</div>
        <div class="pulse-kpi-hint">${meta.hint}</div>
      </article>`;
  }

  function emptyBlock(text) {
    return `<div class="pulse-empty-inline">${text}</div>`;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function refresh() {
    const preset = document.querySelector(".pulse-range button.active")?.dataset.range || "week";
    const { start, end, prevStart, prevEnd } = rangeBounds(preset, $("pulse-from"), $("pulse-to"));
    $("pulse-status").textContent = "Обновляю данные…";
    $("pulse-period-label").textContent = periodLabel(start, end);
    try {
      const [curEvents, prevEvents] = await Promise.all([
        fetchEvents(start, end),
        fetchEvents(prevStart, prevEnd)
      ]);
      const cur = summarize(curEvents, start, end);
      const prev = summarize(prevEvents, prevStart, prevEnd);
      render(cur, prev);
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
