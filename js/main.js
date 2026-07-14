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
        <div class="cover" style="background:var(--${lead.accent})"></div>
        <div class="cover-emoji">${lead.emoji}</div>
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

  // Промо-баннеры
  const strip = document.getElementById("promo-strip");
  const colorMap = { yellow: "y", pink: "p", lime: "l" };
  strip.innerHTML = promos.map(a => `
    <a class="promo-banner ${colorMap[a.accent] || 'y'}" href="article.html?id=${a.id}">
      <span class="promo-tag">Реклама</span>
      <span class="emoji">${a.emoji}</span>
      <div class="p-body">
        <h3>${a.title}</h3>
        <p>${a.dek}</p>
      </div>
    </a>`).join("");
})();
