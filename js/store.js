/* ============================================================
   SECRET ROOM MEDIA — хранилище и статистика (демо, localStorage)
   В проде это заменяется на Supabase (Postgres + Auth + Storage).
   ============================================================ */

const SRM = {
  KEY_ARTICLES: "srm_articles_v1",
  KEY_STATS: "srm_stats_v1",
  KEY_SETTINGS: "srm_settings_v1",

  /* --- статьи: дефолтные из data.js + созданные в админке --- */
  userArticles() {
    try { return JSON.parse(localStorage.getItem(this.KEY_ARTICLES)) || []; }
    catch (e) { return []; }
  },
  saveUserArticles(list) {
    localStorage.setItem(this.KEY_ARTICLES, JSON.stringify(list));
  },
  allArticles() {
    // пользовательские идут первыми (свежак), затем дефолтные
    // SEO-статьи (type=seo) скрыты с главной и ленты — только по прямой ссылке /seo/*.html
    const user = this.userArticles();
    const userIds = new Set(user.map(a => a.id));
    const base = (window.SRM_DEFAULT_ARTICLES || []).filter(a => !userIds.has(a.id));
    return [...user, ...base].filter(a => !a.hidden && a.type !== "seo");
  },
  allArticlesAdmin() {
    const user = this.userArticles();
    const userIds = new Set(user.map(a => a.id));
    const base = (window.SRM_DEFAULT_ARTICLES || []).filter(a => !userIds.has(a.id));
    return [...user, ...base].filter(a => !a.hidden);
  },
  byId(id) {
    const user = this.userArticles().find(a => a.id === id);
    if (user) return user;
    return (window.SRM_DEFAULT_ARTICLES || []).find(a => a.id === id);
  },
  bySlug(slug) {
    return this.allArticlesAdmin().find(a => a.slug === slug);
  },
  seoCatalog() {
    const baked = window.SRM_SEO_ARTICLES || [];
    const userSeo = this.userArticles()
      .filter(a => a.type === "seo")
      .map(a => ({
        slug: a.slug || a.id,
        title: (a.seo && a.seo.title) || a.title,
        description: (a.seo && a.seo.description) || a.dek || "",
        keywords: (a.seo && a.seo.keywords) || "",
        intro: a.dek || ""
      }));
    const seen = new Set(baked.map(s => s.slug));
    return [...baked, ...userSeo.filter(s => !seen.has(s.slug))];
  },

  upsertArticle(article) {
    const list = this.userArticles();
    const i = list.findIndex(a => a.id === article.id);
    if (i >= 0) list[i] = article; else list.unshift(article);
    this.saveUserArticles(list);
  },
  deleteArticle(id) {
    this.saveUserArticles(this.userArticles().filter(a => a.id !== id));
  },

  /* --- статистика просмотров --- */
  stats() {
    try { return JSON.parse(localStorage.getItem(this.KEY_STATS)) || { views: {}, total: 0, log: [] }; }
    catch (e) { return { views: {}, total: 0, log: [] }; }
  },
  trackView(id) {
    const s = this.stats();
    s.views[id] = (s.views[id] || 0) + 1;
    s.total = (s.total || 0) + 1;
    s.log = s.log || [];
    s.log.push({ id, t: Date.now() });
    if (s.log.length > 500) s.log = s.log.slice(-500);
    localStorage.setItem(this.KEY_STATS, JSON.stringify(s));
  },
  viewsOf(id) { return this.stats().views[id] || 0; },

  /* --- настройки (в т.ч. ключ OpenAI для ИИ-проверки) ---
     Ключ НЕ хранится в коде (репозиторий публичный, GitHub блокирует секреты).
     Вставляется один раз в админке → «Настройки» и живёт только в браузере. */
  DEFAULT_MODEL: "gpt-4o-mini",
  settings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(this.KEY_SETTINGS)) || {}; }
    catch (e) { s = {}; }
    if (!s.model) s.model = this.DEFAULT_MODEL;
    return s;
  },
  saveSettings(obj) {
    localStorage.setItem(this.KEY_SETTINGS, JSON.stringify({ ...this.settings(), ...obj }));
  }
};

window.SRM_STORE = SRM;
