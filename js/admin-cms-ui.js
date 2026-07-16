/* Админка: вкладки Сервисы и Вакансии */
(function () {
  const PARTNER_CATS = [
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

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  let partners = [];
  let jobs = [];
  let editingPartnerId = null;
  let editingJobId = null;

  function toast(msg) {
    const t = $("toast");
    if (!t) return alert(msg);
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  function partnerFormHtml(p) {
    p = p || {};
    return `
      <div class="composer cms-form" id="partner-form-box">
        <div class="composer-body">
          <div class="row">
            <div class="field">
              <label>Название</label>
              <input id="p-name" value="${esc(p.company_name || "")}" placeholder="Octo Browser">
            </div>
            <div class="field">
              <label>Категория</label>
              <select id="p-cat">${PARTNER_CATS.map(c =>
                `<option${(p.category || PARTNER_CATS[0]) === c ? " selected" : ""}>${esc(c)}</option>`
              ).join("")}</select>
            </div>
          </div>
          <div class="field">
            <label>Описание</label>
            <input id="p-desc" value="${esc(p.description || "")}" placeholder="Чем занимается">
          </div>
          <div class="field">
            <label>Условия / выгода</label>
            <input id="p-benefit" value="${esc(p.benefit || "")}" placeholder="Скидка 20%">
          </div>
          <div class="row-3">
            <div class="field">
              <label>Промокод</label>
              <input id="p-promo" value="${esc(p.promo_code || "")}" placeholder="SECRETROOM">
            </div>
            <div class="field">
              <label>Порядок</label>
              <input id="p-sort" type="number" value="${esc(p.sort_order ?? 10)}">
            </div>
            <div class="field">
              <label>Метка кнопки</label>
              <input id="p-link-label" value="${esc(p.link_label || "Перейти")}" placeholder="Перейти">
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Ссылка регистрации / реф</label>
              <input id="p-link" value="${esc(p.link_url || "")}" placeholder="https://...">
            </div>
            <div class="field">
              <label>Сайт компании</label>
              <input id="p-site" value="${esc(p.company_url || "")}" placeholder="https://...">
            </div>
          </div>
          <div class="field">
            <label>Заметка к промо</label>
            <textarea id="p-note" style="min-height:70px">${esc(p.promo_note || "")}</textarea>
          </div>
          <div class="cms-checks">
            <label><input type="checkbox" id="p-featured"${p.is_featured ? " checked" : ""}> Отличное предложение</label>
            <label><input type="checkbox" id="p-active"${p.is_active === false ? "" : " checked"}> Активен (на сайте)</label>
          </div>
          <div class="composer-actions" style="border:0;padding:0;background:transparent">
            <button type="button" class="btn yellow" id="p-save">${p.id ? "Сохранить" : "Добавить сервис"}</button>
            <button type="button" class="btn ghost" id="p-cancel" ${p.id ? "" : "hidden"}>Отмена</button>
          </div>
        </div>
      </div>`;
  }

  function jobFormHtml(j) {
    j = j || {};
    const tags = Array.isArray(j.tags) ? j.tags.join(", ") : (j.tags || "");
    return `
      <div class="composer cms-form" id="job-form-box">
        <div class="composer-body">
          <div class="field">
            <label>Должность</label>
            <input id="j-title" value="${esc(j.title || "")}" placeholder="Редактор / автор">
          </div>
          <div class="field">
            <label>Описание</label>
            <textarea id="j-desc" style="min-height:90px">${esc(j.description || "")}</textarea>
          </div>
          <div class="row">
            <div class="field">
              <label>Теги <span class="hint">через запятую</span></label>
              <input id="j-tags" value="${esc(tags)}" placeholder="Удалёнка, iGaming, Full-time">
            </div>
            <div class="field">
              <label>Ссылка отклика</label>
              <input id="j-apply" value="${esc(j.apply_url || "https://t.me/+KXGg4OHsar0xYWRi")}">
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Порядок</label>
              <input id="j-sort" type="number" value="${esc(j.sort_order ?? 10)}">
            </div>
            <div class="field" style="display:flex;align-items:flex-end">
              <label class="cms-checks" style="margin:0 0 10px"><input type="checkbox" id="j-active"${j.is_active === false ? "" : " checked"}> Активна</label>
            </div>
          </div>
          <div class="composer-actions" style="border:0;padding:0;background:transparent">
            <button type="button" class="btn yellow" id="j-save">${j.id ? "Сохранить" : "Добавить вакансию"}</button>
            <button type="button" class="btn ghost" id="j-cancel" ${j.id ? "" : "hidden"}>Отмена</button>
          </div>
        </div>
      </div>`;
  }

  function bindPartnerForm() {
    $("p-save").onclick = async () => {
      const row = {
        id: editingPartnerId,
        company_name: $("p-name").value.trim(),
        category: $("p-cat").value,
        description: $("p-desc").value.trim(),
        benefit: $("p-benefit").value.trim(),
        promo_code: $("p-promo").value.trim() || null,
        promo_note: $("p-note").value.trim() || null,
        link_url: $("p-link").value.trim() || null,
        link_label: $("p-link-label").value.trim() || "Перейти",
        company_url: $("p-site").value.trim() || null,
        sort_order: Number($("p-sort").value) || 0,
        is_featured: $("p-featured").checked,
        is_active: $("p-active").checked
      };
      try {
        await window.SRM_CMS.savePartner(row);
        toast(editingPartnerId ? "Сервис сохранён" : "Сервис добавлен");
        editingPartnerId = null;
        await loadPartners();
      } catch (e) {
        toast(String(e.message || e));
      }
    };
    const cancel = $("p-cancel");
    if (cancel) cancel.onclick = () => {
      editingPartnerId = null;
      $("partner-form-wrap").innerHTML = partnerFormHtml(null);
      bindPartnerForm();
    };
  }

  function bindJobForm() {
    $("j-save").onclick = async () => {
      const row = {
        id: editingJobId,
        title: $("j-title").value.trim(),
        description: $("j-desc").value.trim(),
        tags: $("j-tags").value,
        apply_url: $("j-apply").value.trim(),
        sort_order: Number($("j-sort").value) || 0,
        is_active: $("j-active").checked
      };
      try {
        await window.SRM_CMS.saveJob(row);
        toast(editingJobId ? "Вакансия сохранена" : "Вакансия добавлена");
        editingJobId = null;
        await loadJobs();
      } catch (e) {
        toast(String(e.message || e));
      }
    };
    const cancel = $("j-cancel");
    if (cancel) cancel.onclick = () => {
      editingJobId = null;
      $("job-form-wrap").innerHTML = jobFormHtml(null);
      bindJobForm();
    };
  }

  function renderPartnersList() {
    const list = $("partners-list");
    if (!partners.length) {
      list.innerHTML = `<p class="cms-empty">Сервисов пока нет</p>`;
      return;
    }
    list.innerHTML = partners.map(p => `
      <div class="post-row">
        <div class="em" style="background:var(--${p.is_featured ? "pink" : "yellow"})">${p.is_active === false ? "⏸" : "🛠"}</div>
        <div class="info">
          <h4>${esc(p.company_name)}</h4>
          <div class="m">${esc(p.category)} · ${p.promo_code ? "промо: " + esc(p.promo_code) : "без промо"} · порядок ${p.sort_order}${p.is_active === false ? " · скрыт" : ""}</div>
        </div>
        <div class="acts">
          <button type="button" class="mini-btn" data-edit-p="${esc(p.id)}">Изм.</button>
          <button type="button" class="mini-btn del" data-del-p="${esc(p.id)}">Удал.</button>
        </div>
      </div>`).join("");

    list.querySelectorAll("[data-edit-p]").forEach(btn => {
      btn.onclick = () => {
        const row = partners.find(x => x.id === btn.dataset.editP);
        if (!row) return;
        editingPartnerId = row.id;
        $("partner-form-wrap").innerHTML = partnerFormHtml(row);
        bindPartnerForm();
        $("partner-form-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    list.querySelectorAll("[data-del-p]").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Удалить сервис?")) return;
        try {
          await window.SRM_CMS.deletePartner(btn.dataset.delP);
          toast("Удалено");
          await loadPartners();
        } catch (e) {
          toast(String(e.message || e));
        }
      };
    });
  }

  function renderJobsList() {
    const list = $("jobs-list");
    if (!jobs.length) {
      list.innerHTML = `<p class="cms-empty">Вакансий пока нет</p>`;
      return;
    }
    list.innerHTML = jobs.map(j => `
      <div class="post-row">
        <div class="em" style="background:var(--lime)">${j.is_active === false ? "⏸" : "💼"}</div>
        <div class="info">
          <h4>${esc(j.title)}</h4>
          <div class="m">${(j.tags || []).map(esc).join(" · ") || "без тегов"} · порядок ${j.sort_order}${j.is_active === false ? " · скрыта" : ""}</div>
        </div>
        <div class="acts">
          <button type="button" class="mini-btn" data-edit-j="${esc(j.id)}">Изм.</button>
          <button type="button" class="mini-btn del" data-del-j="${esc(j.id)}">Удал.</button>
        </div>
      </div>`).join("");

    list.querySelectorAll("[data-edit-j]").forEach(btn => {
      btn.onclick = () => {
        const row = jobs.find(x => x.id === btn.dataset.editJ);
        if (!row) return;
        editingJobId = row.id;
        $("job-form-wrap").innerHTML = jobFormHtml(row);
        bindJobForm();
        $("job-form-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    list.querySelectorAll("[data-del-j]").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Удалить вакансию?")) return;
        try {
          await window.SRM_CMS.deleteJob(btn.dataset.delJ);
          toast("Удалено");
          await loadJobs();
        } catch (e) {
          toast(String(e.message || e));
        }
      };
    });
  }

  async function loadPartners() {
    $("partners-status").textContent = "Загрузка…";
    try {
      const data = await window.SRM_CMS.listPartners();
      partners = data.rows || [];
      $("partners-status").textContent = partners.length + " сервисов";
      $("partner-form-wrap").innerHTML = partnerFormHtml(
        editingPartnerId ? partners.find(p => p.id === editingPartnerId) : null
      );
      bindPartnerForm();
      renderPartnersList();
    } catch (e) {
      $("partners-status").textContent = "Ошибка: " + (e.message || e);
    }
  }

  async function loadJobs() {
    $("jobs-status").textContent = "Загрузка…";
    try {
      const data = await window.SRM_CMS.listJobs();
      jobs = data.rows || [];
      $("jobs-status").textContent = jobs.length + " вакансий";
      $("job-form-wrap").innerHTML = jobFormHtml(
        editingJobId ? jobs.find(j => j.id === editingJobId) : null
      );
      bindJobForm();
      renderJobsList();
    } catch (e) {
      $("jobs-status").textContent = "Ошибка: " + (e.message || e);
    }
  }

  window.SRM_ADMIN_CMS = {
    loadPartners,
    loadJobs
  };
})();
