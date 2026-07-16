/* Страница «Сервисы» — партнёры из Supabase (+ локальный fallback) */
(function () {
  srmMountChrome("services");

  const CATEGORY_ORDER = [
    "Антидетект-браузеры",
    "Клоакинг",
    "Карты",
    "Приложения и PWA",
    "Дизайнеры креативов",
    "Spy-сервисы",
    "Трекеры",
    "Софт для команд",
    "Контент для сайтов (SEO)",
    "Прокси"
  ];

  const FALLBACK = [
    { category: "Антидетект-браузеры", sort_order: 10, company_name: "Vision", description: "Антидетект-браузер", benefit: "Скидка 20% на первую покупку", promo_code: "SECRETVISION" },
    { category: "Антидетект-браузеры", sort_order: 20, company_name: "Dolphin", description: "Антидетект-браузер", benefit: "Скидка 20% на первую оплату", promo_code: "SecretRoom" },
    { category: "Антидетект-браузеры", sort_order: 30, company_name: "Binom", description: "Антидетект-браузер", benefit: "Месяц бесплатно и скидка 40% на оплату второго месяца", promo_code: "SecretRoom", is_featured: true },
    { category: "Антидетект-браузеры", sort_order: 40, company_name: "Octo Browser", description: "Антидетект-браузер", benefit: "Скидка 30% на первую оплату", promo_code: "SECRETROOM30", promo_note: "При регистрации по ссылке введите промокод: SECRETROOM30" },
    { category: "Клоакинг", sort_order: 10, company_name: "Cloaking House", description: "Сервис клоакинга для арбитража", benefit: "Скидка 30% на любую подписку", promo_code: "IGAMCAL30" },
    { category: "Карты", sort_order: 10, company_name: "Combo Cards", description: "Сервис по выпуску виртуальных карт", benefit: "40 карт бесплатно", promo_code: "SECRETROOM", link_label: "Ссылка для регистрации", is_featured: true },
    { category: "Приложения и PWA", sort_order: 10, company_name: "TSL Apps", description: "Аренда PWA-приложений под Gambling", benefit: "+10% к пополнению и 7 дней триала", link_label: "Ссылка для регистрации" },
    { category: "Приложения и PWA", sort_order: 20, company_name: "Apps4You", description: "Аренда PWA-приложений под Gambling", benefit: "Скидка 10%", promo_code: "SECRET10" },
    { category: "Дизайнеры креативов", sort_order: 10, company_name: "Mafia Creo", description: "Студия создания рекламных креативов", benefit: "Скидка 20% на первый заказ", promo_code: "крео20" },
    { category: "Spy-сервисы", sort_order: 10, company_name: "Spy House", description: "Профессиональный спай-сервис для поиска прибыльных рекламных креативов, связок и офферов в форматах Facebook и TikTok, Push, Inpage", benefit: "Скидка 30%", promo_code: "SECRETSPY", is_featured: true },
    { category: "Трекеры", sort_order: 10, company_name: "AIO (Tracker)", description: "Трекер MTK для аналитики трафика", benefit: "Два месяца по цене одного", link_label: "Ссылка для регистрации" },
    { category: "Софт для команд", sort_order: 10, company_name: "AIO (ERP)", description: "ERP-система для управления арбитражной командой", benefit: "Скидка 20% на первый месяц", link_label: "Ссылка для регистрации", is_featured: true },
    { category: "Софт для команд", sort_order: 20, company_name: "CostView", description: "Учет расходов и финансов для медиабаинга", benefit: "Скидка 20%", link_label: "Ссылка для регистрации" },
    { category: "Софт для команд", sort_order: 30, company_name: "Affilka", description: "AI-менеджер для серфинга по рабочим чатам: автоматизация переписок, сбор аналитики и ключевых данных по партнерам", benefit: "Скидка 15%", promo_code: "SECRETAFFILKA" },
    { category: "Контент для сайтов (SEO)", sort_order: 10, company_name: "iGamingTextLab", description: "Контент для игроков на 45+ языках, который создают без ИИ реальные игроки", benefit: "Скидка 15%", promo_code: "SEOWAKE" },
    { category: "Прокси", sort_order: 10, company_name: "MangoProxy", description: "Сервис с топовыми проксями", benefit: "Скидка на резидентские прокси и статические ISP", promo_code: "SECRETROOM", promo_note: "SECRETROOM 20% резидентские · SECRETPROXY 5% static ISP" },
    { category: "Прокси", sort_order: 20, company_name: "ProxyShard", company_url: "https://proxyshard.com", description: "Прокси-сервис для PPC, SEO, парсинга и автоматизации", benefit: "Скидка на прокси 15%", promo_code: "secret", promo_note: "secret — 15% Datacentre и Residential при регистрации по ссылке" }
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
      : (p.link_label && !p.promo_code
          ? `<span class="svc-link-miss">${esc(p.link_label)} — добавь URL в таблице</span>`
          : "");

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
