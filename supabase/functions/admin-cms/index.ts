import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ADMIN_PASS = Deno.env.get("SRM_ADMIN_PASS") ?? "secret2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ALLOW = [
  "https://elenavsemogu.github.io",
  "http://localhost:8099",
  "http://127.0.0.1:8099",
  "null",
];

function cors(origin: string | null) {
  const allow = origin && (ALLOW.includes(origin) || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1") || origin.startsWith("file://"))
    ? origin
    : ALLOW[0];
  return {
    "Access-Control-Allow-Origin": allow === "null" ? "*" : allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  } as Record<string, string>;
}

function db() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500, headers });
    }

    const body = await req.json();
    const password = String(body.password || "");
    if (password !== ADMIN_PASS) {
      return new Response(JSON.stringify({ error: "Неверный пароль" }), { status: 401, headers });
    }

    const action = String(body.action || "");
    const entity = String(body.entity || "");
    const client = db();

    if (action === "list" && entity === "partners") {
      const { data, error } = await client
        .from("media_partners")
        .select("*")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ rows: data || [] }), { headers });
    }

    if (action === "list" && entity === "jobs") {
      const { data, error } = await client
        .from("media_jobs")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ rows: data || [] }), { headers });
    }

    if (action === "upsert" && entity === "partners") {
      const row = body.row || {};
      const payload: Record<string, unknown> = {
        category: String(row.category || "").trim(),
        sort_order: Number(row.sort_order) || 0,
        company_name: String(row.company_name || "").trim(),
        company_url: row.company_url ? String(row.company_url).trim() : null,
        description: String(row.description || "").trim(),
        benefit: String(row.benefit || "").trim(),
        promo_code: row.promo_code ? String(row.promo_code).trim() : null,
        promo_note: row.promo_note ? String(row.promo_note).trim() : null,
        link_url: row.link_url ? String(row.link_url).trim() : null,
        link_label: row.link_label ? String(row.link_label).trim() : "Перейти",
        is_featured: !!row.is_featured,
        is_active: row.is_active !== false,
      };
      if (!payload.company_name || !payload.category) {
        return new Response(JSON.stringify({ error: "Нужны название и категория" }), { status: 400, headers });
      }
      let q;
      if (row.id) {
        q = await client.from("media_partners").update(payload).eq("id", row.id).select("*").single();
      } else {
        q = await client.from("media_partners").insert(payload).select("*").single();
      }
      if (q.error) throw q.error;
      return new Response(JSON.stringify({ row: q.data }), { headers });
    }

    if (action === "upsert" && entity === "jobs") {
      const row = body.row || {};
      const tagsRaw = row.tags;
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.map((t: string) => String(t).trim()).filter(Boolean)
        : String(tagsRaw || "").split(",").map((t: string) => t.trim()).filter(Boolean);
      const payload: Record<string, unknown> = {
        title: String(row.title || "").trim(),
        description: String(row.description || "").trim(),
        tags,
        apply_url: String(row.apply_url || "https://t.me/+KXGg4OHsar0xYWRi").trim(),
        sort_order: Number(row.sort_order) || 0,
        is_active: row.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      if (!payload.title) {
        return new Response(JSON.stringify({ error: "Нужен заголовок вакансии" }), { status: 400, headers });
      }
      let q;
      if (row.id) {
        q = await client.from("media_jobs").update(payload).eq("id", row.id).select("*").single();
      } else {
        q = await client.from("media_jobs").insert(payload).select("*").single();
      }
      if (q.error) throw q.error;
      return new Response(JSON.stringify({ row: q.data }), { headers });
    }

    if (action === "delete" && (entity === "partners" || entity === "jobs")) {
      const id = String(body.id || "");
      if (!id) return new Response(JSON.stringify({ error: "Нет id" }), { status: 400, headers });
      const table = entity === "partners" ? "media_partners" : "media_jobs";
      const { error } = await client.from(table).delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
