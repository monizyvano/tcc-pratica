(function () {
  "use strict";

  function getCfg() {
    return window.IMTSBApiConfig || {};
  }

  function baseHeaders() {
    const cfg = getCfg();
    const token = localStorage.getItem(cfg.tokenStorageKey || "imtsb_api_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function requestByKey(key, payload) {
    const cfg = getCfg();
    if (!cfg.enabled) {
      return { ok: false, message: "API desativada no api-config.js" };
    }

    const meta = cfg.endpoints && cfg.endpoints[key];
    if (!meta || !meta.path || !meta.method) {
      return { ok: false, message: `Endpoint nao configurado: ${key}` };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs || 15000);

    try {
      const url = `${cfg.baseUrl || ""}${meta.path}`;
      const opts = {
        method: meta.method,
        headers: baseHeaders(),
        signal: controller.signal
      };

      if (meta.method !== "GET" && payload !== undefined) {
        opts.body = JSON.stringify(payload);
      }

      const resp = await fetch(url, opts);
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        return {
          ok: false,
          status: resp.status,
          message: data.message || "Falha na API",
          data
        };
      }

      if (data && data.token) {
        localStorage.setItem(cfg.tokenStorageKey || "imtsb_api_token", data.token);
      }

      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        message: error && error.name === "AbortError" ? "Tempo limite da API excedido" : "Erro de conexao com API",
        error: String(error || "")
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  window.IMTSBApiClient = {
    requestByKey,
    login: (payload) => requestByKey("login", payload),
    registerUser: (payload) => requestByKey("registerUser", payload),
    addWorker: (payload) => requestByKey("addWorker", payload),
    getSnapshot: () => requestByKey("getSnapshot"),
    issueTicket: (payload) => requestByKey("issueTicket", payload),
    callNext: (payload) => requestByKey("callNext", payload),
    concludeCurrent: (payload) => requestByKey("concludeCurrent", payload),
    redirectCurrent: (payload) => requestByKey("redirectCurrent", payload),
    setCurrentNote: (payload) => requestByKey("setCurrentNote", payload),
    markReceived: (payload) => requestByKey("markReceived", payload),
    rateTicket: (payload) => requestByKey("rateTicket", payload)
  };
})();
