/* =========================================
   DASH USUÁRIO - FUNCIONALIDADES
   - Menu responsivo
   - Seleção de serviço
   - Emissão de senha (simulada)
   - Logout (Sair)
========================================= */

function clickMenu() {
  const itens = document.getElementById("itens");
  if (!itens) return;
  itens.style.display = itens.style.display === "block" ? "none" : "block";
}

function mudoutamanho() {
  const itens = document.getElementById("itens");
  if (!itens) return;
  itens.style.display = window.innerWidth >= 768 ? "block" : "none";
}

window.addEventListener("resize", mudoutamanho);
window.addEventListener("load", mudoutamanho);

let servicoSelecionado = null;

function sair() {
  localStorage.removeItem("senhaUsuario");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "logintcc.html";
}

function gerarSenha() {
  const servico = servicoSelecionado || "Serviço não especificado";
  const numero = Math.floor(Math.random() * 900) + 100;
  const senha = `N${numero}`;

  const payload = {
    senha,
    servico,
    emitidaEm: new Date().toISOString()
  };

  localStorage.setItem("senhaUsuario", JSON.stringify(payload));
  alert(`Senha emitida: ${senha}\nServiço: ${servico}`);
}

function bindServiceCards() {
  const cards = document.querySelectorAll(".service-card");
  if (!cards || cards.length === 0) return;

  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("ativo"));
      card.classList.add("ativo");
      servicoSelecionado = card.dataset.servico || card.innerText.trim();
    });
  });
}

function bindLogoutButtons() {
  const btn1 = document.getElementById("btnLogout");
  const btn2 = document.getElementById("btnLogoutMobile");

  if (btn1) btn1.addEventListener("click", sair);
  if (btn2) btn2.addEventListener("click", sair);
}

function initUltimaChamadaSimulada() {
  const el = document.getElementById("ultimaChamada");
  if (!el) return;

  const tick = () => {
    const n = Math.floor(Math.random() * 900) + 100;
    el.textContent = `N${n}`;
  };

  tick();
  setInterval(tick, 15000);
}

document.addEventListener("DOMContentLoaded", () => {
  bindServiceCards();
  bindLogoutButtons();
  initUltimaChamadaSimulada();
});
