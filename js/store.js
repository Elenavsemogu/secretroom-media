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
    const user = this.userArticles();
    const userIds = new Set(user.map(a => a.id));
    const base = (window.SRM_DEFAULT_ARTICLES || []).filter(a => !userIds.has(a.id));
    return [...user, ...base].filter(a => !a.hidden);
  },
  byId(id) { return this.allArticles().find(a => a.id === id); },
  bySlug(slug) { return this.allArticles().find(a => a.slug === slug); },

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

  /* --- настройки (в т.ч. ключ OpenAI для ИИ-проверки) --- */
  settings() {
    try { return JSON.parse(localStorage.getItem(this.KEY_SETTINGS)) || {}; }
    catch (e) { return {}; }
  },
  saveSettings(obj) {
    localStorage.setItem(this.KEY_SETTINGS, JSON.stringify({ ...this.settings(), ...obj }));
  }
};

window.SRM_STORE = SRM;
