/* =========================================
   DASH USUÁRIO - FUNCIONALIDADES
   - Menu responsivo
   - Seleção de serviço
   - Emissão de senha (simulada)
   - Logout (Sair)
========================================= */

(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  // Expostas globalmente porque o HTML chama direto via onclick
  window.clickMenu = function clickMenu() {
    const itens = $("itens");
    if (!itens) return;
    itens.style.display = itens.style.display === "block" ? "none" : "block";
  };

  window.mudoutamanho = function mudoutamanho() {
    const itens = $("itens");
    if (!itens) return;
    itens.style.display = window.innerWidth >= 768 ? "block" : "none";
  };

  window.sair = function sair() {
    localStorage.removeItem("senhaUsuario");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "logintcc.html";
  };

  let servicoSelecionado = null;

  function bindServiceCards() {
    const cards = document.querySelectorAll(".service-card");
    if (!cards || cards.length === 0) return;

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((c) => c.classList.remove("ativo"));
        card.classList.add("ativo");

        const ds = card.getAttribute("data-servico");
        const nameEl = card.querySelector(".service-name");
        servicoSelecionado = ds || (nameEl ? nameEl.textContent.trim() : card.textContent.trim());
      });
    });
  }

  window.gerarSenha = function gerarSenha() {
    if (!servicoSelecionado) {
      alert("Selecione um serviço antes de emitir a senha.");
      return;
    }

    const numero = Math.floor(Math.random() * 900) + 100;
    const senha = `N${numero}`;

    const payload = {
      senha,
      servico: servicoSelecionado,
      emitidaEm: new Date().toISOString()
    };

    localStorage.setItem("senhaUsuario", JSON.stringify(payload));
    alert(`Senha emitida: ${senha}\nServiço: ${servicoSelecionado}`);
  };

  function bindLogoutButtons() {
    const btnDesk = $("btnSairUserDesktop");
    const btnMob = $("btnSairUserMobile");

    if (btnDesk) btnDesk.addEventListener("click", window.sair);
    if (btnMob) btnMob.addEventListener("click", window.sair);
  }

  function initUltimaChamadaSimulada() {
    const el = $("ultimaChamada");
    if (!el) return;

    const tick = () => {
      const n = Math.floor(Math.random() * 900) + 100;
      el.textContent = `N${n}`;
    };

    tick();
    setInterval(tick, 15000);
  }

  window.addEventListener("resize", window.mudoutamanho);
  window.addEventListener("load", window.mudoutamanho);

  document.addEventListener("DOMContentLoaded", () => {
    bindServiceCards();
    bindLogoutButtons();
    initUltimaChamadaSimulada();
  });
})();
