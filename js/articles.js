/* Лента статей + сортировка по тематике.
   SEO-гайды не на главной, но в конце списка «Все статьи». */
(function () {
  srmMountChrome("articles");

  const params = new URLSearchParams(location.search);
  let activeCat = params.get("cat") || "Все";

  const all = SRM_STORE.allArticles(); // без SEO
  const seoItems = (SRM_STORE.seoCatalog ? SRM_STORE.seoCatalog() : (window.SRM_SEO_ARTICLES || [])).map(s => ({
    id: "seo-" + s.slug,
    slug: s.slug,
    type: "seo",
    title: s.h1 || s.title,
    dek: s.intro || s.description || "",
    category: "Гайды",
    emoji: "🔎",
    accent: "blue",
    date: "2026-09-01",
    readTime: 8,
    href: "seo/" + s.slug + ".html"
  }));

  const cats = Array.from(new Set([...(window.SRM_CATEGORIES || ["Все"]), "Гайды"]));
  if (!cats.includes("Все")) cats.unshift("Все");

  const filtersEl = document.getElementById("filters");
  const feedEl = document.getElementById("feed");
  const emptyEl = document.getElementById("empty");
  const titleEl = document.getElementById("feed-title");
  const countEl = document.getElementById("feed-count");

  function card(a) {
    if (a.type === "seo" && a.href) {
      return `
  <a class="card" href="${a.href}">
    <div class="thumb" style="background:var(--${a.accent || 'blue'})">
      <span class="badge cat">Гайд</span>
      <span class="emoji">${a.emoji || "🔎"}</span>
    </div>
    <div class="card-body">
      <h3>${a.title}</h3>
      <p class="dek">${a.dek || ""}</p>
      <div class="meta">
        <span class="cat">${a.category}</span>·
        <span>${a.readTime || 8} мин</span>
      </div>
    </div>
  </a>`;
    }
    return srmCardHTML(a);
  }

  function render() {
    filtersEl.innerHTML = cats.map(c =>
      `<button class="chip ${c === activeCat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");

    let regular = activeCat === "Все" || activeCat === "Гайды"
      ? (activeCat === "Гайды" ? [] : all.slice())
      : all.filter(a => a.category === activeCat);
    regular.sort((a, b) => new Date(b.date) - new Date(a.date));

    const seo = (activeCat === "Все" || activeCat === "Гайды") ? seoItems : [];
    const list = [...regular, ...seo];

    titleEl.textContent = activeCat === "Все" ? "Все статьи" : activeCat;
    countEl.textContent = list.length + " " + plural(list.length, ["материал", "материала", "материалов"]);

    if (!list.length) { feedEl.innerHTML = ""; emptyEl.style.display = "block"; return; }
    emptyEl.style.display = "none";
    feedEl.innerHTML = list.map(a => card(a)).join("");
  }

  function plural(n, forms) {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  filtersEl.addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    history.replaceState(null, "", activeCat === "Все" ? "articles.html" : `articles.html?cat=${encodeURIComponent(activeCat)}`);
    render();
  });

  render();
})();
