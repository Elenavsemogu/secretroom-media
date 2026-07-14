/* Лента статей + сортировка по тематике */
(function () {
  srmMountChrome("articles");

  const params = new URLSearchParams(location.search);
  let activeCat = params.get("cat") || "Все";

  const all = SRM_STORE.allArticles();
  const cats = window.SRM_CATEGORIES || ["Все"];

  const filtersEl = document.getElementById("filters");
  const feedEl = document.getElementById("feed");
  const emptyEl = document.getElementById("empty");
  const titleEl = document.getElementById("feed-title");
  const countEl = document.getElementById("feed-count");

  function render() {
    filtersEl.innerHTML = cats.map(c =>
      `<button class="chip ${c === activeCat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");

    const list = activeCat === "Все" ? all : all.filter(a => a.category === activeCat);
    // свежак сверху
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    titleEl.textContent = activeCat === "Все" ? "Все статьи" : activeCat;
    countEl.textContent = list.length + " " + plural(list.length, ["материал", "материала", "материалов"]);

    if (!list.length) { feedEl.innerHTML = ""; emptyEl.style.display = "block"; return; }
    emptyEl.style.display = "none";
    feedEl.innerHTML = list.map(a => srmCardHTML(a)).join("");
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
