/* Виджет «Ивенты в этом месяце» — данные с igaming-calendar.com, без правок календаря */
(function () {
  const CAL_ORIGIN = "https://igaming-calendar.com";
  const EVENTS_URL = CAL_ORIGIN + "/data/events.json";
  const MONTH_LABELS = [
    "", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function absImg(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return CAL_ORIGIN + "/" + String(path).replace(/^\//, "");
  }

  function fmtAttendees(n) {
    const num = Number(n) || 0;
    if (num >= 1000) {
      const k = Math.round(num / 100) / 10;
      return (k % 1 === 0 ? k.toFixed(0) : String(k)) + "k+";
    }
    return num ? num + "+" : "";
  }

  function isPast(ev) {
    const iso = ev.endDate || ev.startDate;
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  function cardHTML(ev) {
    const past = isPast(ev) ? " is-past" : "";
    const img = absImg(ev.heroImage);
    const accent = ev.accentColor || "#2E39F7";
    const att = fmtAttendees(ev.attendees);

    if (ev.cardType === "major") {
      return `
        <article class="srm-cal-card major${past}">
          ${img ? `<img class="srm-cal-img" src="${esc(img)}" alt="" loading="lazy">` : ""}
          <div class="srm-cal-card-body">
            <div class="srm-cal-row">
              <span class="srm-cal-tag">${esc(ev.datesLabel || "")}</span>
              ${att ? `<span class="srm-cal-att">${esc(att)}</span>` : ""}
            </div>
            <h3>${esc(ev.title)}</h3>
            <p>${esc(ev.locationLine || "")}</p>
            ${ev.promo ? `<div class="srm-cal-promo">${esc(ev.promo)}</div>` : ""}
          </div>
        </article>`;
    }

    return `
      <article class="srm-cal-card compact${past}" style="border-left-color:${esc(accent)}">
        <h3>${esc(ev.title)}</h3>
        <p>${esc(ev.locationLine || "")}${ev.datesLabel ? " · " + esc(ev.datesLabel) : ""}</p>
        <div class="srm-cal-row">
          ${att ? `<span class="srm-cal-att">${esc(att)}</span>` : ""}
          ${ev.category ? `<span class="srm-cal-cat">${esc(ev.category)}</span>` : ""}
        </div>
        ${ev.promo ? `<div class="srm-cal-promo">${esc(ev.promo)}</div>` : ""}
      </article>`;
  }

  async function loadMonthEvents() {
    const res = await fetch(EVENTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("events fetch failed");
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.events || []);
    const month = new Date().getMonth() + 1;
    return list
      .filter(e => e && e.visible !== false && Number(e.month) === month)
      .sort((a, b) => {
        const pa = isPast(a) ? 1 : 0;
        const pb = isPast(b) ? 1 : 0;
        if (pa !== pb) return pa - pb;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }

  async function mount(rootId) {
    const root = document.getElementById(rootId);
    if (!root) return;
    const month = new Date().getMonth() + 1;
    const label = MONTH_LABELS[month] || "";
    const year = new Date().getFullYear();

    root.innerHTML = `
      <div class="section-head">
        <h2>Ивенты <span class="dot">/</span> в этом месяце</h2>
        <a href="calendar.html">Весь календарь →</a>
      </div>
      <a class="srm-cal-month" href="calendar.html" aria-label="Открыть календарь — ${label} ${year}">
        <div class="srm-cal-month-head">
          <span class="srm-cal-num">${String(month).padStart(2, "0")}</span>
          <span class="srm-cal-name">${esc(label)}</span>
          <span class="srm-cal-year">${year}</span>
        </div>
        <div class="srm-cal-list" id="srm-cal-list">
          <div class="srm-cal-loading">Загружаю ивенты…</div>
        </div>
      </a>`;

    const listEl = document.getElementById("srm-cal-list");
    try {
      const events = await loadMonthEvents();
      if (!events.length) {
        listEl.innerHTML = `<div class="srm-cal-empty">В этом месяце пока пусто — смотри весь календарь.</div>`;
        return;
      }
      listEl.innerHTML = events.map(cardHTML).join("");
    } catch (e) {
      listEl.innerHTML = `
        <div class="srm-cal-empty">
          Не удалось подтянуть ивенты.
          <span class="srm-cal-fallback">Открой <strong>календарь</strong> — там всё на месте.</span>
        </div>`;
    }
  }

  window.SRM_CAL_WIDGET = { mount };
})();
