(function () {
  "use strict";

  // Yvano essa é a configuracao base para integracao com backend.
  // ajustar apenas este ficheiro.
  window.IMTSBApiConfig = {
    enabled: false,
    baseUrl: "http://localhost:3000/api",
    timeoutMs: 15000,
    tokenStorageKey: "imtsb_api_token",
    endpoints: {
      login: { method: "POST", path: "/auth/login" },
      registerUser: { method: "POST", path: "/users/register" },
      addWorker: { method: "POST", path: "/workers" },

      getSnapshot: { method: "GET", path: "/realtime/snapshot" },
      issueTicket: { method: "POST", path: "/tickets" },
      callNext: { method: "POST", path: "/tickets/call-next" },
      concludeCurrent: { method: "POST", path: "/tickets/conclude" },
      redirectCurrent: { method: "POST", path: "/tickets/redirect" },
      setCurrentNote: { method: "POST", path: "/tickets/note" },
      markReceived: { method: "POST", path: "/tickets/received" },
      rateTicket: { method: "POST", path: "/tickets/rate" }
    }
  };
})();
