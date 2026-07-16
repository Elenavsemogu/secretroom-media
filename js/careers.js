/* Страница вакансий — данные из Supabase media_jobs */
(function () {
  srmMountChrome("careers");

  const FALLBACK = [
    { title: "Редактор / автор", tags: ["Удалёнка", "iGaming", "Full-time"], description: "Писать новости и разборы про рынок. Нужен острый язык и насмотренность.", apply_url: "https://t.me/+KXGg4OHsar0xYWRi" },
    { title: "SMM-менеджер", tags: ["Удалёнка", "Telegram", "Part-time"], description: "Вести канал, придумывать мемы, разгонять посевы.", apply_url: "https://t.me/+KXGg4OHsar0xYWRi" },
    { title: "Дизайнер обложек", tags: ["Проектно", "Figma", "Мемы"], description: "Делать те самые дерзкие обложки постов в фирменном стиле.", apply_url: "https://t.me/+KXGg4OHsar0xYWRi" },
    { title: "Sales / реклама", tags: ["Удалёнка", "%", "B2B"], description: "Продавать рекламу партнёрам рынка и вести их до результата.", apply_url: "https://t.me/+KXGg4OHsar0xYWRi" }
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function fetchJobs() {
    const cfg = window.SRM_SUPABASE;
    if (!cfg?.url || !cfg?.anonKey) return FALLBACK;
    const url = `${cfg.url}/rest/v1/media_jobs?is_active=eq.true&select=*&order=sort_order.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey
      }
    });
    if (!res.ok) throw new Error("supabase " + res.status);
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows : FALLBACK;
  }

  function render(jobs) {
    const root = document.getElementById("jobs");
    if (!jobs.length) {
      root.innerHTML = `<p style="font-weight:700;color:var(--gray)">Сейчас открытых вакансий нет — пиши в Telegram всё равно.</p>`;
      return;
    }
    root.innerHTML = jobs.map(j => {
      const tags = Array.isArray(j.tags) ? j.tags : [];
      const href = j.apply_url || "https://t.me/+KXGg4OHsar0xYWRi";
      return `
        <div class="job">
          <div>
            <h3>${esc(j.title)}</h3>
            <div class="j-meta">${tags.map(t => `<span class="badge ghost">${esc(t)}</span>`).join("")}</div>
            <p style="margin-top:10px;max-width:60ch;color:#33332f">${esc(j.description || "")}</p>
          </div>
          <a class="btn yellow" href="${esc(href)}" target="_blank" rel="noopener">Откликнуться →</a>
        </div>`;
    }).join("");
  }

  fetchJobs()
    .then(render)
    .catch(() => render(FALLBACK));
})();
