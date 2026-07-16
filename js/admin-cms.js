/* Admin CMS API — сервисы и вакансии через Edge Function */
window.SRM_CMS = (function () {
  const PASS = () => sessionStorage.getItem("srm_admin_pass") || "secret2026";

  function endpoint() {
    const cfg = window.SRM_SUPABASE;
    if (!cfg?.url) throw new Error("Supabase не настроен");
    return cfg.url.replace(/\/$/, "") + "/functions/v1/admin-cms";
  }

  async function call(payload) {
    const cfg = window.SRM_SUPABASE;
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey
      },
      body: JSON.stringify({ password: PASS(), ...payload })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    return data;
  }

  return {
    listPartners: () => call({ action: "list", entity: "partners" }),
    savePartner: (row) => call({ action: "upsert", entity: "partners", row }),
    deletePartner: (id) => call({ action: "delete", entity: "partners", id }),
    listJobs: () => call({ action: "list", entity: "jobs" }),
    saveJob: (row) => call({ action: "upsert", entity: "jobs", row }),
    deleteJob: (id) => call({ action: "delete", entity: "jobs", id })
  };
})();
