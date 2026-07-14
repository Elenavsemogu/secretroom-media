/* Главная страница */
(function () {
  srmMountChrome("home");

  const all = SRM_STORE.allArticles();
  const mains = all.filter(a => a.type === "main");
  const tg = all.filter(a => a.type === "tg");
  const promos = all.filter(a => a.type === "promo");

  // rail head icon
  const rh = document.getElementById("rail-head");
  if (rh) rh.insertAdjacentHTML("afterbegin", SRM_TG_ICO);

  // HERO: главный + 2 мини
  const hero = document.getElementById("hero");
  const lead = mains.find(a => a.featured) || mains[0];
  const side = mains.filter(a => a.id !== (lead && lead.id)).slice(0, 2);
  if (lead) {
    hero.innerHTML = `
      <a class="hero-lead" href="article.html?id=${lead.id}">
        ${lead.cover ? `<img class="cover" src="${lead.cover}" alt="">` : `<div class="cover" style="background:var(--${lead.accent})"></div><div class="cover-emoji">${lead.emoji}</div>`}
        <div class="body">
          <span class="badge ${lead.source === 'tg' ? 'tg' : 'cat'}">${lead.source === 'tg' ? 'из Telegram' : lead.category}</span>
          <h1>${lead.title}</h1>
          <p class="dek">${lead.dek}</p>
        </div>
      </a>
      <div class="hero-side">
        ${side.map(a => `
          <a class="mini" href="article.html?id=${a.id}">
            <span class="badge cat">${a.category}</span>
            <h3>${a.title}</h3>
            <div class="meta">${srmFmtDate(a.date)} · ${a.readTime} мин</div>
          </a>`).join("")}
      </div>`;
  }

  // Полотно: первая карточка широкая, остальные сеткой
  const feed = document.getElementById("main-feed");
  const feedItems = mains.filter(a => a.id !== (lead && lead.id));
  feed.innerHTML = feedItems.map((a, i) => srmCardHTML(a, i === 0 && feedItems.length > 2)).join("");

  // Сайдбар «из ТГ»
  const rail = document.getElementById("tg-rail");
  rail.innerHTML = tg.map(a => `
    <a class="rail-item" href="article.html?id=${a.id}">
      <div class="k">${a.category} · из ТГ</div>
      <h4>${a.title}</h4>
      <div class="meta">${srmFmtDate(a.date)} · почитать здесь или в канале ↗</div>
    </a>`).join("") || `<div class="rail-item">Пока пусто</div>`;

  // Промо: один большой баннер + сетка мелких
  const colorMap = { yellow: "y", pink: "p", lime: "l", blue: "b" };
  const promoHero = promos[0];
  const promoRest = promos.slice(1);

  document.getElementById("promo-hero").innerHTML = promoHero ? `
    <a class="promo-banner ${colorMap[promoHero.accent] || 'y'}" href="article.html?id=${promoHero.id}">
      <span class="promo-tag">Реклама</span>
      ${promoHero.cover ? `<img class="promo-thumb" src="${promoHero.cover}" alt="" loading="lazy">` : `<span class="emoji">${promoHero.emoji}</span>`}
      <div class="p-body">
        <h3>${promoHero.title}</h3>
        <p>${promoHero.dek}</p>
      </div>
    </a>` : "";

  document.getElementById("promo-small").innerHTML = promoRest.map(a => `
    <a class="promo-small ${colorMap[a.accent] || 'y'}" href="article.html?id=${a.id}">
      <span class="promo-tag">Реклама</span>
      ${a.cover ? `<img class="promo-small-thumb" src="${a.cover}" alt="" loading="lazy">` : `<span class="ps-emoji">${a.emoji}</span>`}
      <div class="ps-body"><h4>${a.title}</h4></div>
    </a>`).join("");
})();
