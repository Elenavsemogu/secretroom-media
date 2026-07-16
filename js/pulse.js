/* Пульс — дашборд аналитики Secret Room Media */
(function () {
  const SOURCE_META = {
    direct: { label: "Прямые заходы", hint: "Переход по прямому адресу или из закладок", ico: "①", color: "var(--yellow)" },
    referral: { label: "С других сайтов", hint: "Переходы по внешним ссылкам", ico: "②", color: "var(--lime)" },
    search: { label: "Поисковые системы", hint: "Органический поиск", ico: "③", color: "var(--blue)" },
    social: { label: "Социальные сети", hint: "Переходы из социальных сетей и мессенджеров", ico: "④", color: "var(--pink)" },
    internal: { label: "Внутренние страницы", hint: "Переходы между разделами сайта", ico: "⑤", color: "#ddd" },
    main: { label: "Главная страница", hint: "Переходы с главной страницы", ico: "⑥", color: "var(--yellow)" },
    other: { label: "Прочее", hint: "Источник не определён", ico: "·", color: "#ccc" }
  };

  const KPI_META = [
    { key: "pageviews", label: "Просмотры страниц", hint: "Общее число открытий страниц, включая повторные", ico: "01", tone: "y" },
    { key: "uniques", label: "Уникальные посетители", hint: "Число уникальных посетителей по идентификатору в браузере", ico: "02", tone: "l" },
    { key: "sessions", label: "Сессии", hint: "Отдельные визиты; новая сессия после 30 минут бездействия", ico: "03", tone: "w" },
    { key: "avgTime", label: "Среднее время", hint: "Средняя длительность пребывания на материале", ico: "04", tone: "p" },
    { key: "readRate", label: "Дочитывание", hint: "Доля просмотров статей с достижением конца текста", ico: "05", tone: "w" },
    { key: "ctr", label: "Переходы дальше", hint: "Доля просмотров с последующим кликом по разделу сайта", ico: "06", tone: "w" },
    { key: "social", label: "Социальные действия", hint: "Нажатия «поделиться» и переходы во внешние соцсети", ico: "07", tone: "b" }
  ];

  const NET_LABELS = { telegram: "Telegram", vk: "ВКонтакте", x: "X", facebook: "Facebook", copy: "Копирование", other: "Прочее" };

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
      return { text: "н/д", cls: "flat" };
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
    const opts = { day: "numeric", month: "short", year: "numeric" };
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

  function socialNetwork(e) {
    const n = e.meta && e.meta.network;
    if (n) return n;
    const href = (e.meta && e.meta.href) || e.referrer || "";
    if (/t\.me|telegram/i.test(href)) return "telegram";
    if (/vk\.com/i.test(href)) return "vk";
    if (/twitter|x\.com/i.test(href)) return "x";
    if (/facebook/i.test(href)) return "facebook";
    return "other";
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
          views: 0,
          reads: 0,
          socialTotal: 0,
          social: { telegram: 0, vk: 0, x: 0, facebook: 0, copy: 0, other: 0 }
        };
      }
      byArticle[key].views++;
    });
    social.forEach(e => {
      const key = e.article_id || e.page_path || "page";
      if (!byArticle[key]) return;
      const net = socialNetwork(e);
      byArticle[key].social[net] = (byArticle[key].social[net] || 0) + 1;
      byArticle[key].socialTotal++;
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

    const socialByNet = { telegram: 0, vk: 0, x: 0, facebook: 0, copy: 0, other: 0 };
    social.forEach(e => {
      const n = socialNetwork(e);
      socialByNet[n] = (socialByNet[n] || 0) + 1;
    });

    return {
      pageviews: pageviews.length,
      uniques: visitors.size,
      sessions: sessions.size,
      avgTime,
      readRate,
      ctr,
      social: social.length,
      socialByNet,
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
        <strong>Данные за период отсутствуют</strong>
        <p>Показатели появятся после просмотра страниц сайта в выбранном интервале.</p>
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
        <span>Максимум за день: <strong>${fmtNum(peak)}</strong>${peakDay ? " (" + new Date(peakDay.date + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) + ")" : ""}</span>
        <span>Число дней в периоде: <strong>${points.length}</strong></span>
      </div>`;
  }

  function donutHTML(rows) {
    if (!rows.length) return "";
    const total = rows.reduce((s, r) => s + r.count, 0) || 1;
    const colors = ["#F5DA0F", "#C8E712", "#2E39F7", "#F6ADE5", "#1B1B1B", "#bbb", "#888"];
    let acc = 0;
    const stops = rows.map((r, i) => {
      const start = (acc / total) * 100;
      acc += r.count;
      const end = (acc / total) * 100;
      return `${colors[i % colors.length]} ${start}% ${end}%`;
    }).join(", ");
    return `<div class="pulse-donut-wrap">
      <div class="pulse-donut" style="background:conic-gradient(${stops})"></div>
      <div class="pulse-donut-legend">
        ${rows.map((r, i) => `
          <div class="pulse-donut-item">
            <i style="background:${colors[i % colors.length]}"></i>
            <span>${r.label}</span>
            <strong>${fmtNum(r.count)}</strong>
            <em>${fmtPct(r.pct)}</em>
          </div>`).join("")}
      </div>
    </div>`;
  }

  function render(cur, prev) {
    $("pulse-kpi").innerHTML = KPI_META.map(meta => {
      let val = cur[meta.key];
      let prevVal = prev[meta.key];
      let display = val;
      if (meta.key === "avgTime") return kpiCard(meta, fmtTime(val), fmtDelta(val, prevVal));
      if (meta.key === "readRate" || meta.key === "ctr") return kpiCard(meta, fmtPct(val), fmtDelta(val, prevVal));
      return kpiCard(meta, fmtNum(val), fmtDelta(val, prevVal));
    }).join("");

    $("pulse-spark-wrap").innerHTML = chartHTML(cur.spark);

    const maxSrc = cur.sourceRows[0]?.count || 1;
    $("pulse-sources").innerHTML = cur.sourceRows.length
      ? donutHTML(cur.sourceRows) + cur.sourceRows.map(r => `
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
      : emptyBlock("Данные по источникам за выбранный период отсутствуют.");

    $("pulse-pubs").innerHTML = cur.publications.length
      ? `<div class="pulse-table-wrap">
          <table class="pulse-data-table">
            <thead>
              <tr>
                <th>Материал</th>
                <th>Дата</th>
                <th>Автор</th>
                <th>Просмотры</th>
                <th>Telegram</th>
                <th>ВКонтакте</th>
                <th>Копир.</th>
                <th>Прочее</th>
                <th>Всего соц.</th>
              </tr>
            </thead>
            <tbody>
              ${cur.publications.slice(0, 20).map(p => `
                <tr>
                  <td class="pulse-td-title">${p.id ? `<a href="article.html?id=${p.id}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</td>
                  <td>${p.date ? srmFmtDate(p.date) : "—"}</td>
                  <td>${esc(p.author)}</td>
                  <td class="num">${fmtNum(p.views)}</td>
                  <td class="num">${fmtNum(p.social.telegram)}</td>
                  <td class="num">${fmtNum(p.social.vk)}</td>
                  <td class="num">${fmtNum(p.social.copy)}</td>
                  <td class="num">${fmtNum((p.social.other || 0) + (p.social.x || 0) + (p.social.facebook || 0))}</td>
                  <td class="num"><strong>${fmtNum(p.socialTotal)}</strong></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <div class="pulse-legend">Социальные действия учитываются по нажатиям кнопок «Поделиться» и переходам во внешние сервисы.</div>`
      : emptyBlock("Данные по материалам за выбранный период отсутствуют.");

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
      : emptyBlock("Данные по авторам отсутствуют.");

    const netParts = Object.entries(cur.socialByNet || {})
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${NET_LABELS[k] || k}: ${fmtNum(v)}`)
      .join(" · ");

    $("pulse-note").textContent = cur.empty
      ? "За выбранный период события не зафиксированы. Откройте страницы сайта и обновите отчёт."
      : ("Сбор данных выполняется собственным модулем учёта. Изменение к предыдущему сопоставимому периоду указано в карточках показателей." + (netParts ? " Социальные действия: " + netParts + "." : ""));
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
    $("pulse-status").textContent = "Обновление данных…";
    $("pulse-period-label").textContent = periodLabel(start, end);
    try {
      const [curEvents, prevEvents] = await Promise.all([
        fetchEvents(start, end),
        fetchEvents(prevStart, prevEnd)
      ]);
      render(summarize(curEvents, start, end), summarize(prevEvents, prevStart, prevEnd));
      $("pulse-status").textContent = "Обновлено: " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
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
