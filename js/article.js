/* Страница отдельной статьи + счётчик просмотров */
(function () {
  srmMountChrome("");

  const id = new URLSearchParams(location.search).get("id");
  const a = id && SRM_STORE.byId(id);
  const root = document.getElementById("article");

  if (!a) {
    root.innerHTML = `<div class="section"><h1 class="display" style="font-size:48px">404</h1><p>Статья не найдена. <a href="articles.html" style="text-decoration:underline">Ко всем статьям</a></p></div>`;
    document.getElementById("more").innerHTML = "";
    return;
  }

  // SEO
  document.title = (a.seo && a.seo.title) ? a.seo.title : `${a.title} — Secret Room Media`;
  const md = document.getElementById("meta-desc");
  if (md) md.setAttribute("content", (a.seo && a.seo.description) ? a.seo.description : (a.dek || ""));

  // счётчик просмотров
  SRM_STORE.trackView(a.id);
  const views = SRM_STORE.viewsOf(a.id);

  const isPromo = a.type === "promo";
  const kicker = isPromo
    ? `<span class="badge promo">Реклама</span><span class="badge cat">${a.category}</span>`
    : (a.source === "tg"
        ? `<span class="badge tg">из Telegram</span><span class="badge cat">${a.category}</span>`
        : `<span class="badge cat">${a.category}</span>`);

  const tgSource = a.source === "tg"
    ? `<a class="tg-source" href="${a.tgLink || '#'}" target="_blank" rel="noopener">${SRM_TG_ICO} Оригинал в Telegram-канале — почитать можно и здесь ↗</a>`
    : "";

  const legacyBody = (a.body || []).map(block => {
    if (block.type === "inline-promo") {
      return `<div class="inline-promo" style="background:var(--${block.accent || 'lime'})">
        <span class="promo-tag">${block.tag || 'Реклама'}</span>
        <h4>${block.title}</h4>
        <p>${block.text}</p>
        ${block.link ? `<p style="margin-top:12px"><a class="btn" href="${block.link}" target="_blank" rel="noopener">${block.cta || 'Подробнее'} ↗</a></p>` : ""}
      </div>`;
    }
    return `<p>${block.text}</p>`;
  }).join("");

  const bodyHTML = a.bodyHtml || legacyBody;

  const partnerCTA = (isPromo && a.partnerLink)
    ? `<div class="inline-promo" style="background:var(--${a.accent || 'yellow'})"><span class="promo-tag">Партнёрская ссылка</span><h4>Перейти к партнёру</h4><p style="margin-top:10px"><a class="btn" href="${a.partnerLink}" target="_blank" rel="noopener">Открыть ↗</a></p></div>`
    : "";

  root.innerHTML = `
    <div class="article-hero">
      <div class="kicker">${kicker}</div>
      <h1>${a.title}</h1>
      <p class="dek">${a.dek || ""}</p>
      <div class="article-meta">
        <span><strong>${a.author || "Secret Room"}</strong></span>·
        <span>${srmFmtDate(a.date)}</span>·
        <span>${a.readTime || 2} мин чтения</span>·
        <span>👁 ${views} просмотров</span>
      </div>
    </div>
    <div class="article-cover" style="background:var(--${a.accent || 'yellow'})">
      ${a.cover ? `<img src="${a.cover}" alt="${a.title}">` : `<span class="emoji">${a.emoji || "📰"}</span>`}
    </div>
    <div class="article-body">
      ${tgSource}
      ${bodyHTML}
      ${partnerCTA}
      <div class="tags">${(a.tags || []).map(t => `<span class="tag">#${t}</span>`).join("")}</div>
      <div class="share-bar" id="share-bar">
        <span class="share-label">Поделиться материалом</span>
        <button type="button" class="share-btn" data-share="telegram">Telegram</button>
        <button type="button" class="share-btn" data-share="vk">ВКонтакте</button>
        <button type="button" class="share-btn" data-share="copy">Копировать ссылку</button>
      </div>
    </div>`;

  // Читайте ещё
  const more = SRM_STORE.allArticles()
    .filter(x => x.id !== a.id && x.type !== "tg")
    .slice(0, 4);
  document.getElementById("more").innerHTML = more.map(x => srmCardHTML(x)).join("");

  const shareUrl = location.href;
  const shareText = a.title;
  document.getElementById("share-bar")?.querySelectorAll("[data-share]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const kind = btn.dataset.share;
      if (kind === "telegram") {
        const href = "https://t.me/share/url?url=" + encodeURIComponent(shareUrl) + "&text=" + encodeURIComponent(shareText);
        if (window.SRM_TRACK) SRM_TRACK.trackSocial("telegram", href);
        window.open(href, "_blank", "noopener,noreferrer");
      } else if (kind === "vk") {
        const href = "https://vk.com/share.php?url=" + encodeURIComponent(shareUrl) + "&title=" + encodeURIComponent(shareText);
        if (window.SRM_TRACK) SRM_TRACK.trackSocial("vk", href);
        window.open(href, "_blank", "noopener,noreferrer");
      } else if (kind === "copy") {
        try {
          await navigator.clipboard.writeText(shareUrl);
          if (window.SRM_TRACK) SRM_TRACK.trackSocial("copy", shareUrl);
          btn.textContent = "Ссылка скопирована";
          setTimeout(() => { btn.textContent = "Копировать ссылку"; }, 1600);
        } catch (_) {
          prompt("Скопируйте ссылку:", shareUrl);
        }
      }
    });
  });
})();
