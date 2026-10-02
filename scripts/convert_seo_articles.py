#!/usr/bin/env python3
"""Convert uploaded SEO markdown drafts into static HTML + WP seed JSON.

Strips editor instructions (alt-tag briefs, cross-link TODOs, layout notes)
but applies them: meta tags, internal links, table scroll wrappers, image alts.
"""
from __future__ import annotations

import base64
import json
import re
from pathlib import Path

import markdown

UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
ROOT = Path("/workspace")
SEO_DIR = ROOT / "seo"
IMG_DIR = ROOT / "seo" / "images"

# Convert only drafts present in uploads/; merge into existing seed JSON by slug.
ARTICLES = [
    {
        "file": "______White_Label____________________________________________________________2_3________1048.md",
        "slug": "white-label-kazino-zapusk-2-3-mesyaca",
        "h1_fallback": "White Label решения для казино: как запустить казино с чужим софтом за 2–3 месяца",
        "keywords": "white label казино, онлайн казино под ключ, казино под ключ, создать онлайн казино, готовое онлайн казино, запуск онлайн казино, white label igaming",
    },
    {
        "file": "Copy_of___________-_________________________________________________________________________________________5595.md",
        "slug": "antidetekt-brauzery-arbitrazh-multiakkaunting",
        "h1_fallback": "Антидетект-браузеры для арбитража и мультиаккаунтинга: как работают, какой выбрать и как проверить",
        "keywords": "антидетект браузер, антидетект браузеры, антидетект браузер для арбитража, браузер для мультиаккаунтинга, мультиаккаунтинг, антидетект для арбитража",
    },
    {
        "file": "Copy_of__________________________________________________________________________________________5103.md",
        "slug": "licenzirovanie-kazino-malta-kipr-kyurasao-filippiny",
        "h1_fallback": "Лицензирование казино по странам: Мальта, Кипр, Кюрасао, Филиппины и лучшие альтернативы",
        "keywords": "лицензия на онлайн казино, лицензия онлайн казино, игорная лицензия Кюрасао, игорная лицензия Мальта, лицензия для онлайн казино, лицензия для казино, лицензия на игорный бизнес",
    },
]

# Internal cross-links → published SEO URLs
CROSS_LINKS = [
    # (google doc id fragment or None, anchor text regex, static html, wp path)
    (
        "1gXcKRGXH9RTo0okZejxY5JaHZjguLBgr0Q9VZsbtQlc",
        r"как выбрать провайдера|собрать портфель провайдеров|полный гайд операторов",
        "kak-vybrat-provajdera-online-kazino.html",
        "/seo/kak-vybrat-provajdera-online-kazino/",
    ),
    (
        "147VUGvD0pXIECCyJC8d7AXgdaCW0NetYaqH_4lcLaM8",
        r"провайдеры слотов|ведущие провайдеры слотов|ТОП-20",
        "provajdery-slotov-top-20-2026.html",
        "/seo/provajdery-slotov-top-20-2026/",
    ),
]


def parse_meta(raw: str) -> tuple[str, str, str]:
    title = ""
    desc = ""
    body = raw
    # Drafts use escaped tags like \<Title\>
    m = re.search(r"\\?<Title\\?>\s*(.+?)\s*\\?<Description\\?>", raw, re.S | re.I)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()
    m = re.search(r"\\?<Description\\?>\s*(.+?)\s*\\?<Alt", raw, re.S | re.I)
    if not m:
        m = re.search(r"\\?<Description\\?>\s*(.+?)\s*\n#\s", raw, re.S | re.I)
    if m:
        desc = re.sub(r"\s+", " ", m.group(1)).strip()
    # Cut meta preamble up to first markdown H1
    hm = re.search(r"^#\s+", raw, re.M)
    if hm:
        body = raw[hm.start() :]
    return title, desc, body


def strip_draft_images(body: str) -> str:
    """Drop draft screenshots / recommended images — SEO articles are text-only.

    Source MD includes acceptance screenshots and layout placeholders at the end;
    editors asked not to publish them (text-only handoff).
    """
    # Remove markdown image refs like ![][image1] or ![alt][image2]
    body = re.sub(r"!\[.*?\]\[image\d+\]\s*", "", body)
    # Drop base64 data-URI definitions (can be multi-megabyte)
    body = re.sub(
        r"\[image\d+\]:\s*<data:image/[^>]+>\s*",
        "",
        body,
        flags=re.I,
    )
    # Any leftover inline data images
    body = re.sub(r"!\[[^\]]*\]\(<data:image/[^>]+>\)\s*", "", body, flags=re.I)
    return body


def clean_instructions(body: str) -> str:
    # Remove explicit cross-link TODOs, keep/replace surrounding Google Doc links
    body = re.sub(
        r"\(ПЕРЕЛИНКОВКА НА СТАТЬЮ:[^)]+\)",
        "",
        body,
    )
    # Layout notes for editors — apply in CSS, don't show
    body = re.sub(
        r"^\*Для верстки:[^*]+\*\s*$",
        "",
        body,
        flags=re.M,
    )
    # Replace Google Docs draft links with published SEO article URLs
    for doc_id, _anchor_re, static_url, _wp in CROSS_LINKS:
        body = re.sub(
            rf"\[([^\]]+)\]\(https://docs\.google\.com/document/d/{re.escape(doc_id)}[^)]*\)",
            lambda m, u=static_url: f"[{m.group(1)}]({u})",
            body,
            flags=re.I,
        )
    # Fallback by anchor text if doc id missing/changed
    body = re.sub(
        r"\[([^\]]*(?:как выбрать провайдера|собрать портфель провайдеров)[^\]]*)\]\(https://docs\.google\.com/document/[^)]+\)",
        r"[\1](kak-vybrat-provajdera-online-kazino.html)",
        body,
        flags=re.I,
    )
    body = re.sub(
        r"\[([^\]]*(?:провайдеры слотов|ведущие провайдеры слотов)[^\]]*)\]\(https://docs\.google\.com/document/[^)]+\)",
        r"[\1](provajdery-slotov-top-20-2026.html)",
        body,
        flags=re.I,
    )
    # Bold markers like **операторов** stay as markdown
    # Normalize escaped hyphens
    body = body.replace(r"\-", "-")
    body = body.replace(r"\&", "&")
    body = body.replace(r"\$", "$")
    # Collapse excessive blank lines
    body = re.sub(r"\n{3,}", "\n\n", body)
    # Fix broken emphasis left by draft edits (e.g. не **является → не является)
    body = re.sub(r"не\s+\*\*является", "не является", body)
    # Trailing *** after italic open (*) leaves stray ** in HTML
    body = re.sub(r"\*{2,}\s*$", "", body, flags=re.M)
    body = re.sub(r"\*\*(\s*[.。])", r"\1", body)
    return body.strip() + "\n"


def md_to_html(body: str) -> str:
    html = markdown.markdown(
        body,
        extensions=["tables", "nl2br", "sane_lists"],
        output_format="html5",
    )
    # Wrap tables for mobile horizontal scroll + sticky first column
    html = re.sub(
        r"(<table>.*?</table>)",
        r'<div class="seo-table-wrap">\1</div>',
        html,
        flags=re.S,
    )
    # Soften strong spam: leave as-is (content intentional for SEO)
    # Clean stray ** left by broken draft markdown (unclosed bold)
    html = re.sub(r"</em>\s*\*\*", "</em>", html)
    html = re.sub(r"\*\*", "", html)
    return html


def strip_h1(html: str) -> tuple[str, str]:
    m = re.match(r"<h1>(.*?)</h1>\s*", html, re.S)
    if not m:
        return "", html
    # Remove nested tags for title text
    title = re.sub(r"<[^>]+>", "", m.group(1)).strip()
    return title, html[m.end() :]


def wp_permalink_placeholder(slug: str) -> str:
    return f"/seo/{slug}/"


def html_for_wp(html: str) -> str:
    # Point relative image and article links to WP-friendly paths
    html = html.replace('src="images/', 'src="/wp-content/themes/secretroom-media/assets/seo/')
    for _doc, _re, static_url, wp_url in CROSS_LINKS:
        html = html.replace(f'href="{static_url}"', f'href="{wp_url}"')
    return html


def esc_attr(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_static_page(meta: dict, h1: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc_attr(meta['title'])} — Secret Room Media</title>
  <meta name="description" content="{esc_attr(meta['description'])}">
  <meta name="keywords" content="{esc_attr(meta['keywords'])}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="https://secretroom.media/seo/{meta['slug']}.html">
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <header class="site-header"><div class="wrap" style="justify-content:space-between">
    <a class="logo" href="../index.html"><img class="logo-img" src="../assets/logo.png" alt="Secret Room Media"></a>
    <a class="btn ghost" href="../articles.html">Все статьи →</a>
  </div></header>

  <main class="wrap article-body seo-article" style="padding-top:40px">
    <h1 style="font-size:clamp(28px,4.2vw,48px);text-transform:uppercase;margin-bottom:20px">{esc_attr(h1)}</h1>
{body_html}
    <p style="margin-top:40px"><a class="btn" href="../index.html">← На главную Secret Room Media</a></p>
  </main>

  <div id="srm-footer"></div>
  <script src="../js/data.js"></script>
  <script src="../js/store.js"></script>
  <script>
    document.getElementById("srm-footer").innerHTML =
      '<footer class="site-footer"><div class="wrap"><div class="footer-bottom"><span>© 2026 Secret Room Media</span><span>18+ · Информационный материал</span></div></div></footer>';
  </script>
</body>
</html>
"""



def main() -> None:
    SEO_DIR.mkdir(parents=True, exist_ok=True)
    json_path = ROOT / "wordpress" / "secretroom-media" / "inc" / "seo-articles-data.json"
    catalog_path = ROOT / "data" / "seo-articles.json"

    # Merge into existing seed so a new batch keeps prior guides.
    existing_wp: dict[str, dict] = {}
    if json_path.exists():
        for item in json.loads(json_path.read_text(encoding="utf-8")):
            existing_wp[item["slug"]] = item
    existing_catalog: dict[str, dict] = {}
    if catalog_path.exists():
        for item in json.loads(catalog_path.read_text(encoding="utf-8")):
            existing_catalog[item["slug"]] = item

    for cfg in ARTICLES:
        src = UPLOADS / cfg["file"]
        if not src.exists():
            print(f"SKIP missing upload: {cfg['file']}")
            continue
        raw = src.read_text(encoding="utf-8")
        seo_title, description, body = parse_meta(raw)
        if not seo_title:
            seo_title = cfg["h1_fallback"]
        if not description:
            description = cfg["h1_fallback"]

        body = strip_draft_images(body)
        body = clean_instructions(body)
        html = md_to_html(body)
        h1, body_html = strip_h1(html)
        if not h1:
            h1 = cfg["h1_fallback"]
        body_html = re.sub(r"<p>\s*<img\b[^>]*>\s*(?:<br\s*/?>\s*<img\b[^>]*>\s*)*</p>", "", body_html, flags=re.I)
        body_html = re.sub(r"<p>\s*<img\b[^>]*>\s*</p>", "", body_html, flags=re.I)
        body_html = re.sub(r"<img\b[^>]*>", "", body_html, flags=re.I)

        meta = {
            "slug": cfg["slug"],
            "title": seo_title,
            "description": description,
            "keywords": cfg["keywords"],
        }
        (SEO_DIR / f"{cfg['slug']}.html").write_text(
            build_static_page(meta, h1, body_html), encoding="utf-8"
        )

        existing_wp[cfg["slug"]] = {
            "slug": cfg["slug"],
            "title": h1,
            "seo_title": seo_title,
            "description": description,
            "keywords": cfg["keywords"],
            "excerpt": "",
            "content": html_for_wp(body_html),
        }
        existing_catalog[cfg["slug"]] = {
            "slug": cfg["slug"],
            "title": seo_title,
            "description": description,
            "keywords": cfg["keywords"],
            "intro": description[:180],
            "h1": h1,
            "images": [],
        }
        print(f"OK {cfg['slug']}: {len(body_html)} chars html, text-only (no images)")

    preferred = [
        "kak-vybrat-provajdera-online-kazino",
        "partnerskie-programmy-igaming-komissii",
        "provajdery-slotov-top-20-2026",
        "white-label-kazino-zapusk-2-3-mesyaca",
        "antidetekt-brauzery-arbitrazh-multiakkaunting",
        "licenzirovanie-kazino-malta-kipr-kyurasao-filippiny",
    ]
    ordered = [s for s in preferred if s in existing_wp] + [
        s for s in existing_wp if s not in preferred
    ]
    wp_items = [existing_wp[s] for s in ordered]
    catalog = [existing_catalog[s] for s in ordered if s in existing_catalog]

    json_path.write_text(json.dumps(wp_items, ensure_ascii=False, indent=2), encoding="utf-8")
    catalog_path.parent.mkdir(parents=True, exist_ok=True)
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Wrote", json_path, f"({len(wp_items)} articles)")
    print("Wrote", catalog_path)


if __name__ == "__main__":
    main()
