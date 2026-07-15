import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const ALLOW = [
  "https://elenavsemogu.github.io",
  "http://localhost:8099",
  "http://127.0.0.1:8099",
];

function cors(origin: string | null) {
  const allow = origin && ALLOW.includes(origin) ? origin : ALLOW[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  } as Record<string, string>;
}

const SYS_PROOF = `Ты корректор Secret Room Media — дерзкого русскоязычного медиа про iGaming. Финальная вычитка перед публикацией.

ПРОВЕРЯЙ ТОЛЬКО:
— орфографию и опечатки
— пунктуацию (запятые, тире, кавычки)
— явные грамматические ошибки
— оборванные или дублирующиеся фразы

НЕ ТРОГАЙ И НЕ КОММЕНТИРУЙ:
— сленг, мат, разговорный тон («бабки», «хитрожопый», «жопу», «чёрнуха» и т.п.) — это фирменный стиль
— юмор, иронию, провокационные формулировки
— отсутствие вступления или выводов — посты пишут как в Telegram
— длину предложений, «улучшение стиля», SEO, структуру

ФОРМАТ ОТВЕТА (строго):
Если замечаний нет — одна строка:
✓ Текст чистый, можно публиковать.

Если есть замечания — нумерованный список, максимум 5 пунктов:
1. «цитата 3–8 слов из текста» — [орфография/пунктуация/грамматика]: как поправить (одна короткая фраза)

НЕ переписывай текст целиком. НЕ предлагай «сделать профессиональнее». НЕ приглаживай тон.`;

const SYS_SEO = `Ты SEO-редактор Secret Room Media. Подбери мета-теги для статьи: живо, по делу, без канцелярита и «нейросетевухи».

Верни СТРОГО JSON-объект:
{
  "title": "SEO-заголовок до 60 символов, с главным ключом, можно дерзко но без мата",
  "description": "мета-описание до 155 символов, цепляет, отражает суть",
  "keywords": "5–7 поисковых фраз через запятую по теме iGaming",
  "tags": ["3–5", "коротких", "тегов", "без", "решётки"]
}

Не выдумывай факты. Не смягчай заголовок до пресс-релиза. Пиши по-русски.`;

const SYS_FORMAT = `Ты верстальщик Secret Room Media — дерзкого русскоязычного медиа про iGaming.

Получишь заголовок статьи (он уже H1 на сайте — НЕ включай h1 в ответ) и сырой текст.

ЗАДАЧА — разметить текст в HTML для публикации:
— разбей на логичные абзацы <p>
— добавь <h2> для крупных смысловых блоков, <h3> для подразделов внутри
— 1–2 яркие ключевые фразы можно выделить <blockquote class="art-quote"><p>...</p></blockquote>
— перечисления оформи <ul><li> или <ol><li>
— URL из текста преврати в <a href="..." target="_blank" rel="noopener">текст</a>
— поправь только явные опечатки; сленг, мат, разговорный тон, юмор НЕ трогай и НЕ «улучшай»

ЗАПРЕЩЕНО: h1, img, figure, div, script, markdown, пояснения, комментарии, обёртки \`\`\`

Разрешённые теги: p, h2, h3, blockquote, ul, ol, li, strong, em, a, br

Верни ТОЛЬКО HTML-фрагмент тела статьи, без текста до или после.`;

function systemForMode(mode: string) {
  if (mode === "seo") return SYS_SEO;
  if (mode === "format") return SYS_FORMAT;
  return SYS_PROOF;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }
  try {
    const { text, model, mode } = await req.json();
    if (!text || String(text).trim().length < 5) {
      return new Response(JSON.stringify({ error: "Пустой текст" }), { status: 400, headers });
    }
    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI key not configured" }), { status: 500, headers });
    }

    const m = mode === "seo" || mode === "format" ? mode : "proof";
    const payload: Record<string, unknown> = {
      model: model || "gpt-4o-mini",
      temperature: m === "seo" ? 0.35 : m === "format" ? 0.25 : 0.15,
      messages: [
        { role: "system", content: systemForMode(m) },
        { role: "user", content: String(text) },
      ],
    };
    if (m === "seo") payload.response_format = { type: "json_object" };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_KEY,
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 502, headers });
    }
    const result = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ result }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
