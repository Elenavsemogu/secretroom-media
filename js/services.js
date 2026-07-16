/* Страница «Сервисы» — категории + карточки (дизайн Secret Room) */
(function () {
  srmMountChrome("services");

  const CATEGORY_META = {
    "Антидетект-браузеры": { accent: "yellow", short: "Антики" },
    "Клоакинг": { accent: "blue", short: "Клоакинг" },
    "Карты": { accent: "pink", short: "Карты" },
    "Приложения и PWA": { accent: "blue", short: "PWA" },
    "Дизайнеры креативов": { accent: "pink", short: "Креативы" },
    "Spy-сервисы": { accent: "blue", short: "Spy" },
    "Трекеры": { accent: "yellow", short: "Трекеры" },
    "Софт для команд": { accent: "pink", short: "Софт" },
    "Контент для сайтов (SEO)": { accent: "blue", short: "SEO" },
    "Прокси": { accent: "yellow", short: "Прокси" }
  };

  // Домены для favicon (как в top50) — даже если в БД нет company_url
  const LOGO_DOMAIN = {
    "Vision": "browser.vision",
    "Dolphin": "dolphin-anty.com",
    "Binom": "binom.org",
    "Octo Browser": "octobrowser.net",
    "Cloaking House": "cloaking.house",
    "Combo Cards": "combocards.com",
    "TSL Apps": "tslapps.com",
    "Apps4You": "apps4you.com",
    "Mafia Creo": "t.me",
    "Spy House": "spy.house",
    "AIO (Tracker)": "aio.partners",
    "AIO (ERP)": "aio.partners",
    "CostView": "costview.io",
    "Affilka": "affilka.com",
    "iGamingTextLab": "igamingtextlab.com",
    "MangoProxy": "mangoproxy.com",
    "ProxyShard": "proxyshard.com"
  };

  const CATEGORY_ORDER = Object.keys(CATEGORY_META);

  // Реф-ссылки / сайты сервисов (CSV часто без URL — только текст «Ссылка…»)
  const PARTNER_LINKS = {
    "Vision": "https://browser.vision/",
    "Dolphin": "https://dolphin-anty.com/",
    "Binom": "https://binom.org/",
    "Octo Browser": "https://octobrowser.net/",
    "Cloaking House": "https://cloaking.house/",
    "Combo Cards": "https://combocards.com/",
    "TSL Apps": "https://tslapps.com/",
    "Apps4You": "https://apps4you.com/",
    "Spy House": "https://spy.house/",
    "AIO (Tracker)": "https://aio.partners/",
    "AIO (ERP)": "https://aio.partners/",
    "CostView": "https://costview.io/",
    "Affilka": "https://affilka.com/",
    "iGamingTextLab": "https://igamingtextlab.com/",
    "MangoProxy": "https://mangoproxy.com/",
    "ProxyShard": "https://proxyshard.com/?ref=12749"
  };

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

  let allRows = [];
  let activeCat = "all";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0] || "")
      .join("")
      .toUpperCase() || "?";
  }

  function partnerDomain(p) {
    if (LOGO_DOMAIN[p.company_name]) return LOGO_DOMAIN[p.company_name];
    try {
      if (p.company_url) return new URL(p.company_url).hostname.replace(/^www\./, "");
      if (p.link_url) return new URL(p.link_url).hostname.replace(/^www\./, "");
    } catch (_) {}
    return "";
  }

  function faviconUrl(p) {
    const domain = partnerDomain(p);
    if (!domain) return "";
    return "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(domain) + "&sz=128";
  }

  function partnerHref(p) {
    if (p.link_url) return p.link_url;
    if (PARTNER_LINKS[p.company_name]) return PARTNER_LINKS[p.company_name];
    if (p.company_url) return p.company_url;
    const d = partnerDomain(p);
    if (d && d !== "t.me") return "https://" + d;
    return "";
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

  function countByCat(rows) {
    const m = {};
    rows.forEach(r => { m[r.category] = (m[r.category] || 0) + 1; });
    return m;
  }

  function filteredRows() {
    if (activeCat === "all") return allRows.slice();
    return allRows.filter(r => r.category === activeCat);
  }

  function renderFilters() {
    const counts = countByCat(allRows);
    const catsEl = document.getElementById("svc-cats");
    const catKeys = CATEGORY_ORDER.filter(c => counts[c]);

    catsEl.innerHTML = `
      <button type="button" class="svc-cat-pill${activeCat === "all" ? " active" : ""}" data-cat="all">
        Все <span class="svc-count">${allRows.length}</span>
      </button>
      ${catKeys.map(c => {
        const n = counts[c] || 0;
        return `<button type="button" class="svc-cat-pill${activeCat === c ? " active" : ""}" data-cat="${esc(c)}">
          ${esc((CATEGORY_META[c] && CATEGORY_META[c].short) || c)} <span class="svc-count">${n}</span>
        </button>`;
      }).join("")}`;

    catsEl.querySelectorAll("[data-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCat = btn.dataset.cat;
        renderFilters();
        renderList();
      });
    });
  }

  function partnerCard(p, idx) {
    const meta = CATEGORY_META[p.category] || { accent: "yellow", short: p.category };
    const accent = meta.accent;
    const fav = faviconUrl(p);
    const href = partnerHref(p);
    const nameInner = href
      ? `<a href="${esc(href)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(p.company_name)}</a>`
      : esc(p.company_name);

    const promo = p.promo_code
      ? `<button type="button" class="svc-card-promo" data-code="${esc(p.promo_code)}" title="Скопировать промокод">
           <span>Промокод · клик = копировать</span><strong>${esc(p.promo_code)}</strong>
         </button>`
      : "";

    const link = href
      ? `<a class="btn svc-card-cta" href="${esc(href)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(p.link_label || "Перейти")} ↗</a>`
      : "";

    return `
      <article class="svc-card tone-${accent}${p.is_featured ? " featured" : ""}" style="animation-delay:${Math.min(idx, 12) * 40}ms">
        ${p.is_featured ? `<span class="svc-badge">Отличное предложение</span>` : ""}
        <div class="svc-card-top">
          <div class="svc-logo${fav ? " has-img" : ""}" style="background:var(--${accent})">
            ${fav ? `<img src="${esc(fav)}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.remove('has-img');this.nextElementSibling.style.display='grid'">` : ""}
            <span class="svc-logo-fallback" style="${fav ? "display:none" : ""}">${esc(initials(p.company_name))}</span>
          </div>
          <div class="svc-card-head">
            <h3 class="svc-card-name">${nameInner}</h3>
            <div class="svc-card-tag">${esc(p.category)}</div>
          </div>
        </div>
        <p class="svc-card-desc">${esc(p.description || "")}</p>
        <div class="svc-card-advantage">${esc(p.benefit || "")}</div>
        ${p.promo_note ? `<div class="svc-card-note">${esc(p.promo_note)}</div>` : ""}
        <div class="svc-card-foot">${promo}${link}${(!promo && !link) ? `<span class="svc-card-miss">Условия уточняйте у партнёра</span>` : ""}</div>
      </article>`;
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

  function renderList() {
    const root = document.getElementById("services-root");
    const rows = filteredRows();
    if (!rows.length) {
      root.innerHTML = `<div class="svc-empty">В этой категории пока нет сервисов.</div>`;
      return;
    }

    const groups = groupByCategory(rows);
    let i = 0;
    root.innerHTML = groups.map(([cat, items]) => {
      const meta = CATEGORY_META[cat] || { accent: "yellow" };
      return `
        <section class="svc-section" id="cat-${esc(cat)}">
          <div class="svc-section-head">
            <h3 class="svc-cat-title">
              <span class="svc-cat-dot" style="background:var(--${meta.accent})"></span>
              ${esc(cat)}
            </h3>
            <span class="svc-section-count">${items.length}</span>
          </div>
          <div class="svc-grid">
            ${items.map(p => partnerCard(p, i++)).join("")}
          </div>
        </section>`;
    }).join("");

    root.querySelectorAll(".svc-card-promo").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const code = btn.dataset.code || "";
        try {
          await navigator.clipboard.writeText(code);
          btn.classList.add("copied");
          const strong = btn.querySelector("strong");
          const old = strong.textContent;
          strong.textContent = "Скопировано";
          setTimeout(() => { strong.textContent = old; btn.classList.remove("copied"); }, 1400);
        } catch (_) {
          prompt("Скопируйте промокод:", code);
        }
      });
    });
  }

  const root = document.getElementById("services-root");
  root.innerHTML = `<div class="svc-loading">Загрузка сервисов…</div>`;

  fetchPartners()
    .then(rows => {
      allRows = rows;
      renderFilters();
      renderList();
    })
    .catch(() => {
      allRows = FALLBACK;
      renderFilters();
      renderList();
    });
})();
