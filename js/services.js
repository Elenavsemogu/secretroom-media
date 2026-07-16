/* Страница «Сервисы» — партнёры из Supabase (+ локальный fallback) */
(function () {
  srmMountChrome("services");

  const CATEGORY_ORDER = [
    "Приложения и PWA",
    "Дизайнеры креативов",
    "Spy-сервисы",
    "Трекеры",
    "Софт для команд",
    "Контент для сайтов (SEO)",
    "Прокси",
    "Антидетект-браузеры",
    "Клоакинг",
    "Карты"
  ];

  const FALLBACK = [
    { category: "Софт для команд", sort_order: 10, company_name: "AIO (ERP)", description: "ERP-система для управления арбитражной командой", benefit: "Скидка 20% на первый месяц", is_featured: true },
    { category: "Софт для команд", sort_order: 30, company_name: "Affilka", description: "AI-менеджер для рабочих чатов", benefit: "Скидка 15%", promo_code: "SECRETAFFILKA" },
    { category: "Контент для сайтов (SEO)", sort_order: 10, company_name: "iGamingTextLab", description: "Контент для игроков на 45+ языках без ИИ", benefit: "Скидка 15%", promo_code: "SEOWAKE" },
    { category: "Прокси", sort_order: 10, company_name: "MangoProxy", description: "Сервис с топовыми прокси", benefit: "Скидка на резидентские и static ISP", promo_code: "SECRETROOM", promo_note: "SECRETROOM 20% / SECRETPROXY 5%" },
    { category: "Прокси", sort_order: 20, company_name: "ProxyShard", company_url: "https://proxyshard.com", description: "Прокси для PPC, SEO, парсинга", benefit: "Скидка 15%", promo_code: "secret" },
    { category: "Антидетект-браузеры", sort_order: 10, company_name: "Vision", description: "Антидетект-браузер", benefit: "Скидка 20% на первую покупку", promo_code: "SECRETVISION" },
    { category: "Антидетект-браузеры", sort_order: 20, company_name: "Dolphin", description: "Антидетект-браузер", benefit: "Скидка 20% на первую оплату", promo_code: "SecretRoom" },
    { category: "Антидетект-браузеры", sort_order: 30, company_name: "Binom", description: "Антидетект-браузер", benefit: "Месяц бесплатно + 40% на второй месяц", promo_code: "SecretRoom", is_featured: true },
    { category: "Антидетект-браузеры", sort_order: 40, company_name: "Octo Browser", description: "Антидетект-браузер", benefit: "Скидка 30% на первую оплату", promo_code: "SECRETROOM30", is_featured: true },
    { category: "Клоакинг", sort_order: 10, company_name: "Cloaking House", description: "Клоакинг для арбитража", benefit: "Скидка 30% на любую подписку", promo_code: "IGAMCAL30" },
    { category: "Карты", sort_order: 10, company_name: "Combo Cards", description: "Виртуальные карты", benefit: "40 карт бесплатно", promo_code: "SECRETROOM", is_featured: true }
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function fetchPartners() {
    const cfg = window.SRM_SUPABASE;
    if (!cfg?.url || !cfg?.anonKey) return FALLBACK;
    const url = `${cfg.url}/rest/v1/media_partners?is_active=eq.true&select=*&order=category.asc,sort_order.asc`;
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

  function groupByCategory(rows) {
    const map = new Map();
    rows.forEach(r => {
      const cat = r.category || "Другое";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(r);
    });
    const ordered = [];
    CATEGORY_ORDER.forEach(cat => {
      if (map.has(cat)) {
        ordered.push([cat, map.get(cat)]);
        map.delete(cat);
      }
    });
    [...map.entries()].forEach(e => ordered.push(e));
    return ordered;
  }

  function partnerCard(p) {
    const name = p.company_url
      ? `<a class="svc-name" href="${esc(p.company_url)}" target="_blank" rel="noopener">${esc(p.company_name)} ↗</a>`
      : `<span class="svc-name">${esc(p.company_name)}</span>`;

    const promo = p.promo_code
      ? `<button type="button" class="svc-promo" data-code="${esc(p.promo_code)}" title="Скопировать">
           <span>Промокод</span><strong>${esc(p.promo_code)}</strong>
         </button>`
      : "";

    const link = p.link_url
      ? `<a class="btn svc-link" href="${esc(p.link_url)}" target="_blank" rel="noopener">${esc(p.link_label || "Ссылка для регистрации")} ↗</a>`
      : "";

    const note = p.promo_note ? `<div class="svc-note">${esc(p.promo_note)}</div>` : "";

    return `
      <article class="svc-card${p.is_featured ? " featured" : ""}">
        ${p.is_featured ? `<span class="svc-badge">Отличное предложение</span>` : ""}
        <div class="svc-top">${name}</div>
        <p class="svc-desc">${esc(p.description || "")}</p>
        <div class="svc-benefit">${esc(p.benefit || "")}</div>
        <div class="svc-actions">${promo}${link}</div>
        ${note}
      </article>`;
  }

  function render(rows) {
    const root = document.getElementById("services-root");
    const groups = groupByCategory(rows);
    root.innerHTML = groups.map(([cat, items]) => `
      <section class="svc-section">
        <h3 class="svc-cat">${esc(cat)}</h3>
        <div class="svc-grid">${items.map(partnerCard).join("")}</div>
      </section>`).join("");

    root.querySelectorAll(".svc-promo").forEach(btn => {
      btn.addEventListener("click", async () => {
        const code = btn.dataset.code || "";
        try {
          await navigator.clipboard.writeText(code);
          btn.classList.add("copied");
          const strong = btn.querySelector("strong");
          const old = strong.textContent;
          strong.textContent = "Скопировано";
          setTimeout(() => { strong.textContent = old; btn.classList.remove("copied"); }, 1400);
        } catch (_) {
          prompt("Скопируй промокод:", code);
        }
      });
    });
  }

  const root = document.getElementById("services-root");
  root.innerHTML = `<div class="svc-loading">Загружаю сервисы…</div>`;
  fetchPartners()
    .then(render)
    .catch(() => render(FALLBACK));
})();
