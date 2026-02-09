(function () {
  "use strict";

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("iemail");
  const passInput = document.getElementById("isenha");

  if (!form || !emailInput || !passInput) return;

  // =========================
  // LOGIN (FRONT-END) - DEMO
  // Substitua por validação real no backend, se tiver.
  // =========================
  const USERS = {
    // ADMIN
    "admin@sb.com": { password: "Admin1234", role: "admin", redirect: "dashadm.html" },

    // USUÁRIO
    "usuario@sb.com": { password: "User12345", role: "usuario", redirect: "dashusuario.html" },

    // TRABALHADOR (ATENDENTE)
    "trabalhador@sb.com": { password: "Trab12345", role: "trabalhador", redirect: "dashtrabalho.html" },
  };

  function normalizeEmail(v) {
    return String(v || "").trim().toLowerCase();
  }

  function setSession(role, email) {
    localStorage.setItem("role", role);
    localStorage.setItem("user", JSON.stringify({ email, role }));
  }

  function routeByRole(role) {
    if (role === "admin") return "dashadm.html";
    if (role === "trabalhador") return "dashtrabalho.html";
    return "dashusuario.html";
  }

  function inferRoleByEmail(email) {
    // fallback simples (caso você não queira hardcode total)
    if (email.includes("adm") || email.includes("admin")) return "admin";
    if (email.includes("trab") || email.includes("worker") || email.includes("atendente")) return "trabalhador";
    return "usuario";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = normalizeEmail(emailInput.value);
    const senha = String(passInput.value || "");

    // 1) Se existir no dicionário de usuários, valida senha e redireciona
    if (USERS[email]) {
      if (senha !== USERS[email].password) {
        alert("Senha incorreta.");
        return;
      }

      setSession(USERS[email].role, email);
      window.location.href = USERS[email].redirect;
      return;
    }

    // 2) Fallback: roteia pelo padrão do email (sem validar senha)
    //    Se você NÃO quiser isso, apague este bloco.
    const role = inferRoleByEmail(email);
    setSession(role, email);
    window.location.href = routeByRole(role);
  });
})();
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", function (e) {
        e.preventDefault(); // ⛔ impede envio automático

        const tipo = document.getElementById("tipo").value;

        switch (tipo) {
            case "admin":
                window.location.href = "dashadm.html";
                break;

            case "trabalhador":
                window.location.href = "dashtrabalho.html";
                break;

            case "usuario":
            default:
                window.location.href = "dashusuario.html";
        }
    });
});
