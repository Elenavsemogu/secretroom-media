/* Виджет календаря ивентов — текущий месяц по умолчанию.
   Данные: CMS календаря (Google Sheets) → fallback data/events-mini.json */
(function () {
  const grid = document.getElementById("cal-grid");
  if (!grid) return;

  const CMS_URL = "https://script.google.com/macros/s/AKfycbx6bSkYURvam0cpdpyQ58lQxLlCOZDJygj4VTVmDmukONZ8Tpr_dlmIsoxAdqYXBJdS/exec";
  const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const FLAGS = { GB:"🇬🇧", HU:"🇭🇺", GE:"🇬🇪", CY:"🇨🇾", UA:"🇺🇦", TH:"🇹🇭", BR:"🇧🇷", AE:"🇦🇪", ES:"🇪🇸", MT:"🇲🇹", RS:"🇷🇸", KZ:"🇰🇿", AM:"🇦🇲", ZA:"🇿🇦", US:"🇺🇸", DE:"🇩🇪", PL:"🇵🇱", RU:"🇷🇺", CA:"🇨🇦", PH:"🇵🇭", MX:"🇲🇽", PT:"🇵🇹", IT:"🇮🇹", SN:"🇸🇳", MO:"🇲🇴" };

  const today = new Date();
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let events = [];

  function normDate(v) {
    if (!v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return String(v);
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function normalize(ev) {
    return {
      title: ev.title,
      startDate: normDate(ev.startDate),
      endDate: normDate(ev.endDate || ev.startDate),
      datesLabel: ev.datesLabel || "",
      location: ev.location || ev.locationLine || "",
      country: ev.country || "",
      website: ev.website || ""
    };
  }

  async function loadEvents() {
    try {
      const res = await fetch(`${CMS_URL}?action=events&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.events || []).filter(e => e.visible !== false).map(normalize);
        if (list.length) { events = list; return; }
      }
    } catch (_) { /* fallback ниже */ }
    const res2 = await fetch("data/events-mini.json");
    const d = await res2.json();
    events = (d.events || []).map(normalize);
  }

  function ymd(dt) { return dt.toISOString().slice(0, 10); }
  function inRange(dayISO, ev) { return dayISO >= ev.startDate && dayISO <= ev.endDate; }

  function monthBounds(year, month) {
    const mm = String(month + 1).padStart(2, "0");
    const last = new Date(year, month + 1, 0).getDate();
    return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(last).padStart(2, "0")}` };
  }

  function monthEvents(year, month) {
    const { start, end } = monthBounds(year, month);
    return events
      .filter(e => e.startDate <= end && e.endDate >= start)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  function render() {
    const year = view.getFullYear(), month = view.getMonth();
    document.getElementById("cal-title").textContent = `${MONTHS[month]} ${year}`;
    const lbl = document.getElementById("cal-month-label");
    if (lbl) lbl.textContent = `${MONTHS[month].toLowerCase()} ${year}`;

    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const evs = monthEvents(year, month);

    const eventDays = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const hit = evs.find(e => inRange(iso, e));
      if (hit) eventDays[d] = hit;
    }

    let cells = "";
    for (let i = 0; i < startWeekday; i++) cells += `<span class="cal-cell empty"></span>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
      const ev = eventDays[d];
      const cls = ["cal-cell"];
      if (isToday) cls.push("today");
      if (ev) cls.push("has-event");
      cells += `<span class="${cls.join(" ")}" ${ev ? `title="${ev.title}"` : ""}>${d}${ev ? '<i class="cal-dot"></i>' : ""}</span>`;
    }
    grid.innerHTML = cells;

    let list = evs;
    let note = "";
    if (!list.length) {
      list = events.filter(e => e.endDate >= ymd(today)).slice(0, 4);
      note = `<div class="cal-empty">В этом месяце ивентов нет. Ближайшие:</div>`;
    }
    const side = document.getElementById("cal-events");
    side.innerHTML = note + (list.map(e => `
      <a class="cal-ev" href="${e.website || "https://elenavsemogu.github.io/calendar-2026/"}" target="_blank" rel="noopener">
        <span class="cal-ev-date">${e.datesLabel || e.startDate.slice(5).replace("-", ".")}</span>
        <span class="cal-ev-body">
          <strong>${FLAGS[e.country] || "📍"} ${e.title}</strong>
          <span class="cal-ev-loc">${e.location || ""}</span>
        </span>
      </a>`).join("") || `<div class="cal-empty">Скоро добавим</div>`);
  }

  document.getElementById("cal-prev").addEventListener("click", () => { view.setMonth(view.getMonth() - 1); render(); });
  document.getElementById("cal-next").addEventListener("click", () => { view.setMonth(view.getMonth() + 1); render(); });

  loadEvents().then(render).catch(() => { events = []; render(); });
})();
