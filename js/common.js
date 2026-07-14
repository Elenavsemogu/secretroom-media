/* ============================================================
   SECRET ROOM MEDIA — общий модуль: шапка, подвал, хелперы
   ============================================================ */

const SRM_LOGO = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M24 2C13 2 6 10 6 20c0 6.5 3.4 12 8.6 15.2L11 46h26l-3.6-10.8C38.6 32 42 26.5 42 20 42 10 35 2 24 2Z" fill="#F5DA0F" stroke="#1B1B1B" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="24" cy="19" r="9" fill="#FBF2E8" stroke="#1B1B1B" stroke-width="2.5"/>
  <circle cx="24" cy="19" r="4.4" fill="#2E39F7" stroke="#1B1B1B" stroke-width="1.5"/>
  <circle cx="24" cy="19" r="1.6" fill="#1B1B1B"/>
  <path d="M22 30h4l2.4 9h-8.8L22 30Z" fill="#1B1B1B"/>
</svg>`;

const SRM_TG_ICO = `<svg class="tg-ico" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M9.8 15.6 9.6 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7l2.6-12.2c.3-1.1-.4-1.6-1.1-1.3L3.2 9.9c-1.1.4-1.1 1-.2 1.3l3.9 1.2 9-5.7c.4-.3.8-.1.5.2l-6.6 8.7Z"/></svg>`;

function srmFmtDate(iso) {
  const m = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

function srmHeader(active) {
  const links = [
    ["index.html", "Главная", "home"],
    ["articles.html", "Статьи", "articles"],
    ["about.html", "О нас", "about"],
    ["careers.html", "Вакансии", "careers"],
  ];
  const nav = links.map(([href, label, key]) =>
    `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`).join("");
  return `
  <div class="topbar"><div class="wrap">
    <span class="live"><span class="dot"></span> Бэкстейдж iGaming-рынка · без цензуры</span>
    <span>Secret Room Media · 2026</span>
  </div></div>
  <header class="site-header"><div class="wrap">
    <a class="logo" href="index.html">
      ${SRM_LOGO}
      <span class="name">Secret Room<span>MEDIA</span></span>
    </a>
    <nav class="nav" id="nav">${nav}</nav>
    <div style="display:flex;align-items:center;gap:10px">
      <a class="btn yellow" href="https://t.me/+KXGg4OHsar0xYWRi" target="_blank" rel="noopener">Наш Telegram ↗</a>
      <button class="burger" id="burger" aria-label="Меню"><span></span><span></span><span></span></button>
    </div>
  </div></header>`;
}

function srmFooter() {
  // скрытые SEO-ссылки: не видны юзеру (class seo-hidden), но доступны краулеру
  const seo = (window.SRM_SEO_ARTICLES || []).map(s =>
    `<a href="seo/${s.slug}.html">${s.title}</a>`).join("");
  return `
  <footer class="site-footer"><div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="logo" href="index.html" style="margin-bottom:14px">
          ${SRM_LOGO}<span class="name" style="color:var(--paper)">Secret Room<span>MEDIA</span></span>
        </a>
        <p style="color:#b8b4a8;max-width:40ch;font-size:14px">Дерзкий бэкстейдж iGaming-рынка. Скандалы, разборы и самые свежие новости индустрии.</p>
      </div>
      <div>
        <h4>Разделы</h4>
        <a href="index.html">Главная</a>
        <a href="articles.html">Статьи</a>
        <a href="about.html">О нас</a>
        <a href="careers.html">Вакансии</a>
      </div>
      <div>
        <h4>Темы</h4>
        <a href="articles.html?cat=Регуляторы">Регуляторы</a>
        <a href="articles.html?cat=Скандалы">Скандалы</a>
        <a href="articles.html?cat=Казино">Казино</a>
        <a href="articles.html?cat=Конференции">Конференции</a>
      </div>
      <div>
        <h4>Контакты</h4>
        <a href="https://t.me/+KXGg4OHsar0xYWRi" target="_blank" rel="noopener">Telegram-канал</a>
        <a href="careers.html">Реклама и сотрудничество</a>
        <a href="admin.html">Вход для редакции</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Secret Room Media. Все права дерзко защищены.</span>
      <span>18+ · Материалы носят информационный характер</span>
    </div>
    <nav class="seo-hidden" aria-hidden="true">${seo}</nav>
  </div></footer>`;
}

function srmMountChrome(active) {
  const h = document.getElementById("srm-header");
  const f = document.getElementById("srm-footer");
  if (h) h.innerHTML = srmHeader(active);
  if (f) f.innerHTML = srmFooter();
  const burger = document.getElementById("burger");
  if (burger) burger.addEventListener("click", () => document.getElementById("nav").classList.toggle("open"));
}

/* карточка статьи для полотна */
function srmCardHTML(a, wide) {
  const views = window.SRM_STORE ? SRM_STORE.viewsOf(a.id) : 0;
  const badge = a.source === "tg"
    ? `<span class="badge tg">из Telegram</span>`
    : `<span class="badge cat">${a.category}</span>`;
  return `
  <a class="card ${wide ? "wide" : ""}" href="article.html?id=${a.id}">
    <div class="thumb" style="background:var(--${a.accent || 'yellow'})">
      ${badge}
      <span class="emoji">${a.emoji || "📰"}</span>
    </div>
    <div class="card-body">
      <h3>${a.title}</h3>
      <p class="dek">${a.dek || ""}</p>
      <div class="meta">
        <span class="cat">${a.category}</span>·
        <span>${srmFmtDate(a.date)}</span>·
        <span>${a.readTime || 2} мин</span>${views ? `·<span>👁 ${views}</span>` : ""}
      </div>
    </div>
  </a>`;
}

window.srmMountChrome = srmMountChrome;
window.srmCardHTML = srmCardHTML;
window.srmFmtDate = srmFmtDate;
window.SRM_TG_ICO = SRM_TG_ICO;
