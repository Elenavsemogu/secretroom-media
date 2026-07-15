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

    // загрузка картинки
    setupImage();

    // верстак
    SRM_EDITOR.init();

    // счётчики SEO + превью SERP
    ["f-seo-title", "f-seo-desc", "f-title", "f-dek"].forEach(id => $(id).addEventListener("input", updateSeoUI));
    $("seo-ai").addEventListener("click", seoAI);
    updateSeoUI();

    // ИИ-проверка на ошибки
    $("ai-check").addEventListener("click", aiCheck);
    $("ai-format").addEventListener("click", aiFormat);

    // публикация
    $("publish").addEventListener("click", publish);
    $("preview-btn").addEventListener("click", showPreview);
    $("preview-close").addEventListener("click", closePreview);
    $("preview-overlay").addEventListener("click", e => { if (e.target === $("preview-overlay")) closePreview(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("preview-overlay").hidden) closePreview(); });
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

  /* ---------- загрузка и сжатие картинки ---------- */
  function setupImage() {
    const dz = $("dropzone"), input = $("f-image");
    dz.addEventListener("click", (e) => { if (e.target.id !== "drop-remove") input.click(); });
    input.addEventListener("change", () => { if (input.files[0]) handleImage(input.files[0]); });
    $("drop-remove").addEventListener("click", (e) => { e.stopPropagation(); clearImage(); });
    ["dragover", "dragenter"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("drag"); }));
    ["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("drag"); }));
    dz.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("image/")) handleImage(f); });
  }
  function handleImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // сжимаем до макс. 1200px, чтобы влезало в localStorage
        const max = 1200;
        let { width: w, height: h } = img;
        if (w > max || h > max) { const k = Math.min(max / w, max / h); w = Math.round(w * k); h = Math.round(h * k); }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataUrl = c.toDataURL("image/jpeg", 0.82);
        setImage(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  function setImage(dataUrl) {
    $("f-cover").value = dataUrl;
    $("f-image-preview").src = dataUrl;
    $("drop-empty").style.display = "none";
    $("drop-filled").style.display = "block";
  }
  function clearImage() {
    $("f-cover").value = ""; $("f-image").value = "";
    $("drop-empty").style.display = "block";
    $("drop-filled").style.display = "none";
  }

  /* ---------- ИИ: общий вызов сервера ---------- */
  const AI_ENDPOINT = "https://rmrwlpoupzaodcsvhsof.supabase.co/functions/v1/ai-check";

  const PROOF_PROMPT = `Ты корректор Secret Room Media — дерзкого русскоязычного медиа про iGaming. Финальная вычитка перед публикацией.

ПРОВЕРЯЙ ТОЛЬКО: орфографию, пунктуацию, явные грамматические ошибки, оборванные фразы.
НЕ ТРОГАЙ: сленг, мат, разговорный тон, юмор, провокации — это фирменный стиль.
ФОРМАТ: если всё ок — «✓ Текст чистый, можно публиковать.» Иначе до 5 пунктов: «цитата» — [тип]: как поправить. НЕ переписывай текст целиком.`;

  const FORMAT_PROMPT = `Ты верстальщик Secret Room Media — дерзкого русскоязычного медиа про iGaming.

Получишь заголовок статьи (он уже H1 на сайте — НЕ включай h1 в ответ) и сырой текст.

ЗАДАЧА — разметить текст в HTML для публикации:
— разбей на логичные абзацы <p>
— добавь <h2> для крупных смысловых блоков, <h3> для подразделов внутри
— 1–2 яркие ключевые фразы можно выделить <blockquote class="art-quote"><p>...</p></blockquote>
— перечисления оформи <ul><li> или <ol><li>
— URL из текста преврати в <a href="..." target="_blank" rel="noopener">текст</a>
— поправь только явные опечатки; сленг, мат, разговорный тон, юмор НЕ трогай и НЕ «улучшай»

ЗАПРЕЩЕНО: h1, img, figure, div, script, markdown, пояснения, обёртки \`\`\`

Разрешённые теги: p, h2, h3, blockquote, ul, ol, li, strong, em, a, br

Верни ТОЛЬКО HTML-фрагмент тела статьи.`;

  function stripAiHtml(raw) {
    return String(raw || "")
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  async function openAiDirect(system, user, model) {
    const key = SRM_STORE.settings().openaiKey;
    if (!key) throw new Error("нет ключа");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        temperature: 0.25,
        messages: [{ role: "system", content: system }, { role: "user", content: user }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || "";
  }


  async function callAI(mode, text) {
    const model = SRM_STORE.settings().model || "gpt-4o-mini";
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, model, mode })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result || "";
  }

  function applySeo(seo) {
    if (seo.title) $("f-seo-title").value = seo.title;
    if (seo.description) $("f-seo-desc").value = seo.description;
    if (seo.keywords) $("f-seo-keys").value = Array.isArray(seo.keywords) ? seo.keywords.join(", ") : seo.keywords;
    if (seo.tags) $("f-tags").value = Array.isArray(seo.tags) ? seo.tags.join(", ") : seo.tags;
    updateSeoUI();
  }

  /* ---------- ИИ подбирает только SEO ---------- */
  function articleText() {
    return ($("f-title").value + "\n\n" + SRM_EDITOR.getPlainText()).trim();
  }

  async function seoAI() {
    const text = articleText();
    if (text.length < 15) { toast("Сначала напиши заголовок и текст"); return; }
    const btn = $("seo-ai"); const old = btn.textContent;
    btn.textContent = "🤖 Думаю…"; btn.disabled = true;
    try {
      const raw = await callAI("seo", text);
      const seo = JSON.parse(raw);
      applySeo(seo);
      toast("SEO-поля заполнены — проверь и поправь");
    } catch (e) {
      toast("SEO не вышло: " + e.message);
    } finally {
      btn.textContent = old; btn.disabled = false;
    }
  }

  /* ---------- ИИ: упорядочить текст в верстаке ---------- */
  async function aiFormat() {
    const source = SRM_EDITOR.getSourceText();
    const title = $("f-title").value.trim();
    if (source.length < 40) { toast("Напиши хотя бы пару абзацев текста"); return; }

    const html = SRM_EDITOR.getHtml();
    if (/art-figure|inline-promo/.test(html)) {
      if (!confirm("В тексте есть картинки или рекламные блоки. ИИ перестроит только текст — их нужно будет вставить заново. Продолжить?")) return;
    }

    const btn = $("ai-format");
    const old = btn.textContent;
    btn.textContent = "🤖 Верстаю…";
    btn.disabled = true;

    const payload = `Заголовок статьи (H1, не включай в HTML):\n${title || "Без заголовка"}\n\n---\n\nТекст:\n${source}`;
    const model = SRM_STORE.settings().model || "gpt-4o-mini";

    try {
      let raw;
      try {
        raw = await callAI("format", payload);
      } catch (e) {
        raw = await openAiDirect(FORMAT_PROMPT, payload, model);
      }
      const cleaned = stripAiHtml(raw);
      if (!cleaned || cleaned.length < 10) throw new Error("пустой ответ");
      SRM_EDITOR.setHtml(cleaned);
      toast("Текст упорядочен — проверь и поправь при необходимости");
    } catch (e) {
      toast("Не вышло: " + e.message);
    } finally {
      btn.textContent = old;
      btn.disabled = false;
    }
  }

  /* ---------- ИИ: только вычитка на ошибки ---------- */
  async function aiCheck() {
    const model = SRM_STORE.settings().model || "gpt-4o-mini";
    const box = $("ai-result");
    const text = articleText();
    if (!text || text.length < 10) { toast("Сначала напиши текст"); return; }

    box.style.display = "block";
    box.textContent = "🤖 Проверяю на ошибки…";
    $("ai-check").disabled = true;

    try {
      const proofText = await callAI("proof", text);
      box.textContent = proofText || "Пустой ответ от ИИ.";
    } catch (e) {
      const key = SRM_STORE.settings().openaiKey;
      if (!key) {
        box.textContent = "Не удалось: " + e.message;
        $("ai-check").disabled = false;
        return;
      }
      try {
        const res2 = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
          body: JSON.stringify({
            model, temperature: 0.15,
            messages: [
              { role: "system", content: PROOF_PROMPT },
              { role: "user", content: text }
            ]
          })
        });
        const data2 = await res2.json();
        box.textContent = data2.error ? ("Ошибка: " + data2.error.message) : (data2.choices?.[0]?.message?.content || "Пустой ответ от ИИ.");
      } catch (e2) {
        box.textContent = "Не удалось: " + e2.message;
      }
    } finally {
      $("ai-check").disabled = false;
    }
  }

  /* ---------- предпросмотр ---------- */
  function draftArticle() {
    const bodyText = SRM_EDITOR.getPlainText();
    return {
      title: $("f-title").value.trim() || "Заголовок статьи",
      dek: $("f-dek").value.trim(),
      type: $("f-type").value,
      source: $("f-source").value,
      category: $("f-cat").value,
      accent: $("f-accent").value,
      cover: $("f-cover").value,
      emoji: "📰",
      tgLink: $("f-link").value.trim(),
      partnerLink: $("f-type").value === "promo" ? $("f-link").value.trim() : "",
      date: new Date().toISOString().slice(0, 10),
      author: $("f-type").value === "promo" ? "Реклама" : "Secret Room",
      readTime: Math.max(1, Math.round((bodyText.split(/\s+/).length || 1) / 180)),
      tags: $("f-tags").value.split(",").map(t => t.trim()).filter(Boolean),
      bodyHtml: SRM_EDITOR.getHtml()
    };
  }

  function articlePreviewHTML(a) {
    const isPromo = a.type === "promo";
    const kicker = isPromo
      ? `<span class="badge promo">Реклама</span><span class="badge cat">${a.category}</span>`
      : (a.source === "tg"
          ? `<span class="badge tg">из Telegram</span><span class="badge cat">${a.category}</span>`
          : `<span class="badge cat">${a.category}</span>`);
    const tgSource = a.source === "tg"
      ? `<a class="tg-source" href="${a.tgLink || '#'}" target="_blank" rel="noopener">${SRM_TG_ICO} Оригинал в Telegram-канале — почитать можно и здесь ↗</a>`
      : "";
    const bodyHTML = a.bodyHtml || "<p><em>Текст статьи пока пустой</em></p>";
    const partnerCTA = (isPromo && a.partnerLink)
      ? `<div class="inline-promo" style="background:var(--${a.accent || 'yellow'})"><span class="promo-tag">Партнёрская ссылка</span><h4>Перейти к партнёру</h4><p style="margin-top:10px"><a class="btn" href="${a.partnerLink}" target="_blank" rel="noopener">Открыть ↗</a></p></div>`
      : "";
    return `
      <div class="article-hero">
        <div class="kicker">${kicker}</div>
        <h1>${a.title}</h1>
        <p class="dek">${a.dek || ""}</p>
        <div class="article-meta">
          <span><strong>${a.author || "Secret Room"}</strong></span>·
          <span>${srmFmtDate(a.date)}</span>·
          <span>${a.readTime || 2} мин чтения</span>·
          <span>👁 предпросмотр</span>
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
      </div>`;
  }

  function showPreview() {
    const a = draftArticle();
    if (!SRM_EDITOR.getPlainText() && !a.dek) { toast("Сначала напиши заголовок или текст"); return; }
    $("preview-body").innerHTML = articlePreviewHTML(a);
    $("preview-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePreview() {
    $("preview-overlay").hidden = true;
    document.body.style.overflow = "";
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
    const bodyHtml = SRM_EDITOR.getHtml();
    const bodyText = SRM_EDITOR.getPlainText();
    if (!bodyText) { toast("Напиши текст статьи"); return; }
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
      emoji: "📰",
      cover: $("f-cover").value || "",
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
      bodyHtml: bodyHtml || "",
      featured: false
    };
    SRM_STORE.upsertArticle(article);
    toast("Опубликовано ✓");
    resetForm();
    renderPosts();
  }
  function resetForm() {
    ["f-id","f-title","f-dek","f-link","f-tags","f-seo-title","f-seo-desc","f-seo-keys"].forEach(id => $(id).value = "");
    $("f-type").value = "main"; $("f-source").value = "original"; $("f-accent").value = "yellow";
    SRM_EDITOR.clear();
    clearImage();
    $("ai-result").style.display = "none"; $("edit-note").style.display = "none";
    updateSeoUI();
  }
  function editArticle(id) {
    const a = SRM_STORE.byId(id);
    if (!a) return;
    $("f-id").value = a.id; $("f-title").value = a.title; $("f-dek").value = a.dek || "";
    $("f-type").value = a.type; $("f-source").value = a.source || "original";
    $("f-cat").value = a.category; $("f-accent").value = a.accent || "yellow";
    if (a.cover) setImage(a.cover); else clearImage();
    $("f-link").value = a.tgLink || a.partnerLink || "";
    if (a.bodyHtml) {
      SRM_EDITOR.setHtml(a.bodyHtml);
    } else {
      const legacy = (a.body || []).filter(b => b.type === "p").map(b => {
        const p = document.createElement("p");
        p.textContent = b.text;
        return p.outerHTML;
      }).join("");
      SRM_EDITOR.setHtml(legacy || "<p><br></p>");
    }
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
