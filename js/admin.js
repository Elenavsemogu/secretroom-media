/* ============================================================
   SECRET ROOM MEDIA — админка (демо)
   Соцсеть-композер + SEO-поля + ИИ-проверка + статистика.
   ============================================================ */
(function () {
  srmMountChrome("");
  const $ = id => document.getElementById(id);
  const DEMO_PASS = "secret2026";

  /* ---------- вход ---------- */
  const gate = $("gate"), admin = $("admin");
  if (sessionStorage.getItem("srm_admin_ok") === "1") { gate.style.display = "none"; admin.style.display = "block"; init(); }
  $("login-btn").addEventListener("click", tryLogin);
  $("pass").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
  function tryLogin() {
    if ($("pass").value === DEMO_PASS) {
      sessionStorage.setItem("srm_admin_ok", "1");
      gate.style.display = "none"; admin.style.display = "block"; init();
    } else toast("Неверный пароль");
  }

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  function init() {
    // категории (без «Все»)
    const cats = (window.SRM_CATEGORIES || []).filter(c => c !== "Все");
    $("f-cat").innerHTML = cats.map(c => `<option>${c}</option>`).join("");

    // табы
    document.querySelectorAll(".admin-tabs button").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelectorAll(".admin-tabs button").forEach(x => x.classList.remove("active"));
        document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        $("panel-" + b.dataset.tab).classList.add("active");
        if (b.dataset.tab === "posts") renderPosts();
        if (b.dataset.tab === "stats") renderStats();
      });
    });

    // настройки
    const s = SRM_STORE.settings();
    if (s.openaiKey) $("s-key").value = s.openaiKey;
    if (s.model) $("s-model").value = s.model;
    $("save-settings").addEventListener("click", () => {
      SRM_STORE.saveSettings({ openaiKey: $("s-key").value.trim(), model: $("s-model").value });
      toast("Настройки сохранены");
    });

    // счётчики SEO + превью SERP
    ["f-seo-title", "f-seo-desc", "f-title", "f-dek"].forEach(id => $(id).addEventListener("input", updateSeoUI));
    $("seo-auto").addEventListener("click", autoSeo);
    updateSeoUI();

    // ИИ
    $("ai-check").addEventListener("click", aiCheck);

    // публикация
    $("publish").addEventListener("click", publish);
    $("reset-form").addEventListener("click", resetForm);
    $("reset-stats").addEventListener("click", () => {
      if (confirm("Сбросить всю статистику просмотров?")) {
        localStorage.removeItem(SRM_STORE.KEY_STATS); renderStats(); toast("Статистика сброшена");
      }
    });
  }

  /* ---------- SEO ---------- */
  function counter(el, len, max) {
    el.textContent = `${len} / ${max} символов`;
    el.className = "counter " + (len === 0 ? "" : len <= max * 0.7 ? "warn" : len <= max ? "ok" : "bad");
    if (len > max) el.textContent += " — слишком длинно, обрежется в Google";
  }
  function updateSeoUI() {
    const t = $("f-seo-title").value || $("f-title").value;
    const d = $("f-seo-desc").value || $("f-dek").value;
    counter($("c-title"), $("f-seo-title").value.length, 60);
    counter($("c-desc"), $("f-seo-desc").value.length, 160);
    $("serp-title").textContent = t || "Заголовок появится здесь";
    $("serp-desc").textContent = d || "Описание появится здесь";
  }
  function autoSeo() {
    const title = $("f-title").value.trim();
    const dek = $("f-dek").value.trim();
    if (!title) { toast("Сначала впиши заголовок"); return; }
    $("f-seo-title").value = (title.length > 57 ? title.slice(0, 57) + "…" : title) + "";
    $("f-seo-desc").value = dek ? (dek.length > 157 ? dek.slice(0, 157) + "…" : dek) : title;
    const words = (title + " " + dek).toLowerCase().replace(/[^a-zа-я0-9\s]/gi, "").split(/\s+/)
      .filter(w => w.length > 4).slice(0, 5);
    $("f-seo-keys").value = [...new Set(words)].join(", ");
    updateSeoUI();
    toast("SEO-поля заполнены — проверь и поправь");
  }

  /* ---------- ИИ-проверка ----------
     Основной путь — серверная функция Supabase (ключ на сервере, работает из коробки).
     Запасной — личный ключ OpenAI из «Настроек», если сервер недоступен. */
  const AI_ENDPOINT = "https://rmrwlpoupzaodcsvhsof.supabase.co/functions/v1/ai-check";

  async function aiCheck() {
    const model = SRM_STORE.settings().model || "gpt-4o-mini";
    const box = $("ai-result");
    const text = ($("f-title").value + "\n\n" + $("f-body").value).trim();
    if (!text || text.length < 10) { toast("Сначала напиши текст"); return; }

    box.style.display = "block";
    box.textContent = "🤖 Проверяю текст…";
    $("ai-check").disabled = true;

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      box.textContent = data.result || "Пустой ответ от ИИ.";
    } catch (e) {
      const key = SRM_STORE.settings().openaiKey;
      if (!key) { box.textContent = "Не удалось получить ответ ИИ: " + e.message + "\n\nМожно вставить свой OpenAI-ключ во вкладке «Настройки» как запасной вариант."; $("ai-check").disabled = false; return; }
      try {
        const res2 = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
          body: JSON.stringify({
            model, temperature: 0.3,
            messages: [
              { role: "system", content: "Ты редактор-корректор русскоязычного медиа про iGaming с дерзким, разговорным тоном. Проверь текст на орфографию, пунктуацию и стиль. Дай короткий список конкретных замечаний (максимум 6 пунктов), каждое — с указанием проблемного места и краткой рекомендацией. Сохраняй дерзкий авторский стиль. Если всё в порядке — так и напиши. НЕ переписывай весь текст целиком." },
              { role: "user", content: text }
            ]
          })
        });
        const data2 = await res2.json();
        box.textContent = data2.error ? ("Ошибка OpenAI: " + data2.error.message) : (data2.choices?.[0]?.message?.content || "Пустой ответ от ИИ.");
      } catch (e2) {
        box.textContent = "Не удалось обратиться к ИИ: " + e2.message;
      }
    } finally {
      $("ai-check").disabled = false;
    }
  }

  /* ---------- публикация ---------- */
  function slugify(s) {
    const map = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
    return s.toLowerCase().split("").map(c => map[c] ?? c).join("")
      .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "post";
  }
  function publish() {
    const title = $("f-title").value.trim();
    if (!title) { toast("Впиши заголовок"); return; }
    const bodyText = $("f-body").value.trim();
    const body = bodyText.split(/\n\s*\n/).map(p => ({ type: "p", text: p.trim() })).filter(b => b.text);

    const id = $("f-id").value || ("u-" + Date.now());
    const article = {
      id,
      slug: slugify(title),
      type: $("f-type").value,
      source: $("f-source").value,
      title,
      dek: $("f-dek").value.trim(),
      category: $("f-cat").value,
      emoji: $("f-emoji").value.trim() || "📰",
      accent: $("f-accent").value,
      tgLink: $("f-link").value.trim(),
      partnerLink: $("f-type").value === "promo" ? $("f-link").value.trim() : "",
      date: new Date().toISOString().slice(0, 10),
      author: $("f-type").value === "promo" ? "Реклама" : "Secret Room",
      readTime: Math.max(1, Math.round(bodyText.split(/\s+/).length / 180)),
      tags: $("f-tags").value.split(",").map(t => t.trim()).filter(Boolean),
      seo: {
        title: $("f-seo-title").value.trim(),
        description: $("f-seo-desc").value.trim(),
        keywords: $("f-seo-keys").value.trim()
      },
      body,
      featured: false
    };
    SRM_STORE.upsertArticle(article);
    toast("Опубликовано ✓");
    resetForm();
    renderPosts();
  }
  function resetForm() {
    ["f-id","f-title","f-dek","f-emoji","f-link","f-body","f-tags","f-seo-title","f-seo-desc","f-seo-keys"].forEach(id => $(id).value = "");
    $("f-type").value = "main"; $("f-source").value = "original"; $("f-accent").value = "yellow";
    $("ai-result").style.display = "none"; $("edit-note").style.display = "none";
    updateSeoUI();
  }
  function editArticle(id) {
    const a = SRM_STORE.byId(id);
    if (!a) return;
    $("f-id").value = a.id; $("f-title").value = a.title; $("f-dek").value = a.dek || "";
    $("f-type").value = a.type; $("f-source").value = a.source || "original";
    $("f-cat").value = a.category; $("f-emoji").value = a.emoji || ""; $("f-accent").value = a.accent || "yellow";
    $("f-link").value = a.tgLink || a.partnerLink || "";
    $("f-body").value = (a.body || []).filter(b => b.type === "p").map(b => b.text).join("\n\n");
    $("f-tags").value = (a.tags || []).join(", ");
    $("f-seo-title").value = a.seo?.title || ""; $("f-seo-desc").value = a.seo?.description || ""; $("f-seo-keys").value = a.seo?.keywords || "";
    $("edit-note").style.display = "inline"; updateSeoUI();
    document.querySelector('.admin-tabs button[data-tab="create"]').click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- список постов ---------- */
  function renderPosts() {
    const list = SRM_STORE.allArticles();
    $("posts-count").textContent = `Всего материалов: ${list.length} (свои — редактируются и удаляются, дефолтные — только правятся поверх)`;
    const typeLabel = { main: "Статья", tg: "из ТГ", promo: "Реклама" };
    $("posts-list").innerHTML = list.map(a => `
      <div class="post-row">
        <div class="em" style="background:var(--${a.accent || 'yellow'})">${a.emoji || "📰"}</div>
        <div class="info">
          <h4>${a.title}</h4>
          <div class="m">${typeLabel[a.type]} · ${a.category} · ${srmFmtDate(a.date)} · 👁 ${SRM_STORE.viewsOf(a.id)}</div>
        </div>
        <div class="acts">
          <button class="mini-btn" data-edit="${a.id}">Править</button>
          <button class="mini-btn del" data-del="${a.id}">Удалить</button>
        </div>
      </div>`).join("");
    $("posts-list").querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editArticle(b.dataset.edit)));
    $("posts-list").querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
      if (confirm("Удалить материал?")) { SRM_STORE.deleteArticle(b.dataset.del); renderPosts(); toast("Удалено"); }
    }));
  }

  /* ---------- статистика ---------- */
  function renderStats() {
    const list = SRM_STORE.allArticles();
    const st = SRM_STORE.stats();
    const total = st.total || 0;
    $("st-total").textContent = total;
    $("st-posts").textContent = list.length;
    $("st-avg").textContent = list.length ? Math.round(total / list.length) : 0;
    const dayAgo = Date.now() - 86400000;
    $("st-today").textContent = (st.log || []).filter(x => x.t > dayAgo).length;

    const ranked = list.map(a => ({ a, v: SRM_STORE.viewsOf(a.id) })).sort((x, y) => y.v - x.v);
    const max = ranked[0]?.v || 1;
    $("stats-list").innerHTML = ranked.map(({ a, v }) => `
      <div class="post-row">
        <div class="em" style="background:var(--${a.accent || 'yellow'})">${a.emoji || "📰"}</div>
        <div class="info">
          <h4>${a.title}</h4>
          <div class="bar-track" style="margin-top:8px"><div class="bar-fill" style="width:${Math.max(4, v / max * 100)}%"></div></div>
        </div>
        <div style="font-family:var(--font-display);font-weight:900;font-size:24px;min-width:60px;text-align:right">${v}</div>
      </div>`).join("") || "<p>Пока нет просмотров. Походи по сайту — статистика появится.</p>";
  }
})();
