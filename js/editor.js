/* Статейный верстак — простой WYSIWYG для админки */
window.SRM_EDITOR = (function () {
  let root, area, fileInput;

  const ALLOWED = new Set([
    "P","H2","H3","H4","STRONG","EM","B","I","A","FIGURE","IMG","FIGCAPTION",
    "UL","OL","LI","BLOCKQUOTE","BR","DIV","SPAN"
  ]);
  const ACCENTS = ["yellow", "lime", "pink", "blue"];

  function init() {
    root = document.getElementById("editor-root");
    area = document.getElementById("editor-area");
    if (!root || !area) return;

    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.hidden = true;
    root.appendChild(fileInput);

    document.querySelectorAll("[data-cmd]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        if (cmd === "link") return insertLink();
        if (cmd === "image") return fileInput.click();
        if (cmd === "quote") return insertQuote();
        if (cmd === "promo") return insertPromo();
        if (cmd === "undo") return exec("undo");
        if (cmd === "redo") return exec("redo");
        if (cmd === "h2" || cmd === "h3" || cmd === "p") {
          exec("formatBlock", cmd === "p" ? "p" : cmd);
        } else {
          exec(cmd);
        }
        area.focus();
      });
    });

    fileInput.addEventListener("change", () => {
      const f = fileInput.files[0];
      fileInput.value = "";
      if (f) insertImage(f);
    });

    area.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text/plain");
      exec("insertText", text);
    });
  }

  function exec(cmd, val) {
    document.execCommand(cmd, false, val == null ? null : val);
  }

  function insertLink() {
    const url = prompt("Ссылка (https://…):", "https://");
    if (!url) return;
    if (window.getSelection().isCollapsed) {
      const text = prompt("Текст ссылки:", url);
      if (!text) return;
      exec("insertHTML", `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`);
    } else {
      exec("createLink", url);
      const sel = window.getSelection();
      if (sel.rangeCount) {
        const a = sel.anchorNode.parentElement?.closest("a") || sel.focusNode.parentElement?.closest("a");
        if (a) { a.target = "_blank"; a.rel = "noopener"; }
      }
    }
    area.focus();
  }

  function insertQuote() {
    const sel = window.getSelection();
    if (!sel.isCollapsed) {
      exec("formatBlock", "blockquote");
      const bq = sel.anchorNode?.parentElement?.closest("blockquote")
        || sel.focusNode?.parentElement?.closest("blockquote");
      if (bq) bq.classList.add("art-quote");
    } else {
      const text = prompt("Текст цитаты:", "");
      if (!text) return;
      exec("insertHTML", `<blockquote class="art-quote"><p>${esc(text)}</p></blockquote><p><br></p>`);
    }
    area.focus();
  }

  function insertPromo() {
    const title = prompt("Заголовок рекламного блока:", "Партнёрское предложение");
    if (title === null) return;
    const text = prompt("Текст блока:", "Короткое описание оффера") || "";
    const link = prompt("Ссылка (https://…, можно пусто):", "https://") || "";
    const cta = prompt("Текст кнопки:", "Подробнее") || "Подробнее";
    const accent = (prompt("Цвет фона: yellow / lime / pink / blue", "lime") || "lime").toLowerCase();
    const bg = ACCENTS.includes(accent) ? accent : "lime";
    const linkHtml = /^https?:\/\//i.test(link)
      ? `<p style="margin-top:12px"><a class="btn" href="${esc(link)}" target="_blank" rel="noopener">${esc(cta)} ↗</a></p>`
      : "";
    const html = `<div class="inline-promo" style="background:var(--${bg})"><span class="promo-tag">Реклама</span><h4>${esc(title)}</h4><p>${esc(text)}</p>${linkHtml}</div><p><br></p>`;
    exec("insertHTML", html);
    area.focus();
  }

  function insertImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        let { width: w, height: h } = img;
        if (w > max || h > max) {
          const k = Math.min(max / w, max / h);
          w = Math.round(w * k); h = Math.round(h * k);
        }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        const src = c.toDataURL("image/jpeg", 0.82);
        const cap = prompt("Подпись к картинке (можно оставить пустым):", "") || "";
        const html = `<figure class="art-figure"><img src="${src}" alt=""><figcaption>${esc(cap)}</figcaption></figure><p><br></p>`;
        exec("insertHTML", html);
        area.focus();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function sanitize(html) {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const walk = (node) => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 1) {
          const tag = ch.tagName;
          if (!ALLOWED.has(tag)) {
            const frag = document.createDocumentFragment();
            while (ch.firstChild) frag.appendChild(ch.firstChild);
            ch.replaceWith(frag);
            walk(node);
            return;
          }
          if (tag === "A") {
            const href = ch.getAttribute("href") || "";
            if (!/^https?:\/\//i.test(href)) ch.removeAttribute("href");
            else { ch.setAttribute("target", "_blank"); ch.setAttribute("rel", "noopener"); }
          }
          if (tag === "IMG") {
            ch.removeAttribute("onerror");
            ch.removeAttribute("onclick");
          }
          [...ch.attributes].forEach(attr => {
            const ok = ["href","src","alt","class","target","rel"].includes(attr.name)
              || (attr.name === "style" && tag === "DIV" && (ch.classList.contains("inline-promo") || attr.value.includes("margin-top")));
            if (!ok) ch.removeAttribute(attr.name);
          });
          if (tag === "DIV" && ch.classList.contains("inline-promo")) {
            const style = ch.getAttribute("style") || "";
            if (!/^background:\s*var\(--(yellow|lime|pink|blue)\)/.test(style)) {
              ch.setAttribute("style", "background:var(--lime)");
            }
          }
          walk(ch);
        }
      });
    };
    walk(doc.body.firstChild);
    return doc.body.firstChild.innerHTML.trim();
  }

  function getHtml() { return area ? sanitize(area.innerHTML) : ""; }
  function setHtml(html) { if (area) area.innerHTML = sanitize(html) || "<p><br></p>"; }
  function getPlainText() { return area ? area.innerText.replace(/\s+/g, " ").trim() : ""; }
  function getSourceText() { return area ? area.innerText.trim() : ""; }
  function clear() { setHtml("<p><br></p>"); }

  return { init, getHtml, setHtml, getPlainText, getSourceText, clear };
})();
