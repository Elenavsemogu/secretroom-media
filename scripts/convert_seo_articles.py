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

ARTICLES = [
    {
        "file": "Copy_of____________________________________-_________________________________b7d5.md",
        "slug": "kak-vybrat-provajdera-online-kazino",
        "h1_fallback": "Как выбрать провайдера для онлайн-казино: полный гайд операторов",
        "keywords": "провайдеры казино, онлайн казино под ключ, софт для казино, white label казино, провайдеры онлайн казино",
        "alt_cycle": [
            "провайдеры казино",
            "онлайн казино под ключ",
            "софт для казино",
            "казино под ключ",
            "софт для онлайн казино",
            "white label казино",
            "провайдеры онлайн казино",
            "провайдер казино",
        ],
    },
    {
        "file": "Copy_of_________________________iGaming________________________________________________eb74.md",
        "slug": "partnerskie-programmy-igaming-komissii",
        "h1_fallback": "Партнерские программы в iGaming: структура, комиссии и правила выбора партнера",
        "keywords": "гемблинг партнерки, партнерки казино, партнерская программа казино, партнерка онлайн казино, казино партнерки",
        "alt_cycle": [
            "гемблинг партнерки",
            "партнерки казино",
            "партнерская программа казино",
            "партнерка казино",
            "партнерские программы гемблинг",
            "партнерка онлайн казино",
            "гемблинг партнерка",
            "партнерская программа онлайн казино",
            "казино партнерки",
            "казино партнерка",
        ],
    },
    {
        "file": "Copy_of___________________________________-20_____________________________________2026______fabf.md",
        "slug": "provajdery-slotov-top-20-2026",
        "h1_fallback": "Провайдеры слотов для казино: ТОП-20 мировых и локальных разработчиков в 2026 году",
        "keywords": "провайдеры казино, провайдеры слотов, провайдеры онлайн казино, лучшие провайдеры казино, провайдеры игровых автоматов",
        "alt_cycle": [
            "провайдеры казино",
            "провайдеры слотов",
            "провайдеры онлайн казино",
            "лучшие провайдеры казино",
            "провайдеры игровых автоматов",
            "провайдеры игрового софта для онлайн казино",
        ],
    },
]

# Internal cross-links (slug of provider-guide article)
GUIDE_SLUG = "kak-vybrat-provajdera-online-kazino"
GUIDE_URL_STATIC = f"{GUIDE_SLUG}.html"
GUIDE_ANCHOR_TEXT = "как выбрать провайдера для онлайн-казино"


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
    # Replace Google Docs links that pointed to the provider guide
    body = re.sub(
        r"\[([^\]]*(?:как выбрать провайдера|собрать портфель провайдеров)[^\]]*)\]\(https://docs\.google\.com/document/[^)]+\)",
        lambda m: f"[{m.group(1)}]({GUIDE_URL_STATIC})",
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
    html = re.sub(
        rf'href="{re.escape(GUIDE_URL_STATIC)}"',
        f'href="{wp_permalink_placeholder(GUIDE_SLUG)}"',
        html,
    )
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
    catalog = []
    wp_items = []

    for cfg in ARTICLES:
        raw = (UPLOADS / cfg["file"]).read_text(encoding="utf-8")
        seo_title, description, body = parse_meta(raw)
        if not seo_title:
            seo_title = cfg["h1_fallback"]
        if not description:
            description = cfg["h1_fallback"]

        # Text-only: drop acceptance screenshots / recommended draft images.
        body = strip_draft_images(body)
        body = clean_instructions(body)
        html = md_to_html(body)
        h1, body_html = strip_h1(html)
        if not h1:
            h1 = cfg["h1_fallback"]
        # Description stays in <meta>, never in visible body/excerpt.
        body_html = re.sub(r"<p>\s*<img\b[^>]*>\s*(?:<br\s*/?>\s*<img\b[^>]*>\s*)*</p>", "", body_html, flags=re.I)
        body_html = re.sub(r"<p>\s*<img\b[^>]*>\s*</p>", "", body_html, flags=re.I)
        body_html = re.sub(r"<img\b[^>]*>", "", body_html, flags=re.I)

        meta = {
            "slug": cfg["slug"],
            "title": seo_title,
            "description": description,
            "keywords": cfg["keywords"],
        }
        page = build_static_page(meta, h1, body_html)
        (SEO_DIR / f"{cfg['slug']}.html").write_text(page, encoding="utf-8")

        wp_items.append(
            {
                "slug": cfg["slug"],
                "title": h1,
                "seo_title": seo_title,
                "description": description,
                "keywords": cfg["keywords"],
                "excerpt": "",
                "content": html_for_wp(body_html),
            }
        )
        catalog.append(
            {
                "slug": cfg["slug"],
                "title": seo_title,
                "description": description,
                "keywords": cfg["keywords"],
                "intro": description[:180],
                "h1": h1,
                "images": [],
            }
        )
        print(f"OK {cfg['slug']}: {len(body_html)} chars html, text-only (no images)")

    json_path = ROOT / "wordpress" / "secretroom-media" / "inc" / "seo-articles-data.json"
    json_path.write_text(json.dumps(wp_items, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "data" / "seo-articles.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("Wrote", json_path)
    print("Wrote data/seo-articles.json")


if __name__ == "__main__":
    main()
