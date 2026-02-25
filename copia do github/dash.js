let timerInterval;
let startTime;
let isPaused = false;
let currentTime = 0;
let currentTicket = null;
let currentSession = null;

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR');
}

function formatDuration(sec) {
  const total = Math.max(0, Number(sec) || 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parseWaitMinutes(createdAt) {
  if (!createdAt) return '-';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const min = Math.max(0, Math.floor(diffMs / 60000));
  return `${min} minutos`;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-green);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: var(--shadow-strong);
        z-index: 1000;
    `;

  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2800);
}

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now() - (currentTime * 1000);
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (isPaused || !currentTicket) return;
  currentTime = Math.floor((Date.now() - startTime) / 1000);
  const el = document.getElementById('timer');
  if (el) el.textContent = formatDuration(currentTime);
}

function resetTimer() {
  clearInterval(timerInterval);
  currentTime = 0;
  const el = document.getElementById('timer');
  if (el) el.textContent = '00:00';
}

function togglePause() {
  isPaused = !isPaused;
  const pauseBtn = document.getElementById('pauseBtn');
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');

  if (isPaused) {
    if (pauseBtn) pauseBtn.textContent = 'Continuar';
    if (statusDot) statusDot.style.background = 'var(--warning-orange)';
    if (statusText) {
      statusText.textContent = 'Pausado';
      statusText.style.color = 'var(--warning-orange)';
    }
  } else {
    if (pauseBtn) pauseBtn.textContent = 'Pausar';
    if (statusDot) statusDot.style.background = 'var(--success-green)';
    if (statusText) {
      statusText.textContent = 'Em Atendimento';
      statusText.style.color = 'var(--success-green)';
    }
    startTime = Date.now() - (currentTime * 1000);
  }
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderCurrentTicket() {
  const snapshot = window.IMTSBStore.getSnapshot();
  currentTicket = snapshot.queue.find((item) => item.id === snapshot.currentTicketId && item.status === 'em_atendimento') || null;

  const passEl = document.getElementById('currentPassword');
  const typeEl = document.getElementById('passwordType');
  const serviceEl = document.getElementById('serviceValue');
  const waitEl = document.getElementById('waitTime');
  const issuedEl = document.getElementById('issuedAt');
  const obsEl = document.getElementById('obsValue');

  if (!currentTicket) {
    if (passEl) passEl.textContent = '---';
    if (typeEl) typeEl.textContent = 'Aguardando atendimento';
    if (serviceEl) serviceEl.textContent = '-';
    if (waitEl) waitEl.textContent = '-';
    if (issuedEl) issuedEl.textContent = '-';
    if (obsEl) obsEl.textContent = 'Sem observacoes';
    resetTimer();
    return;
  }

  if (passEl) passEl.textContent = currentTicket.code;
  if (typeEl) {
    const isPriority = String(currentTicket.code || '').startsWith('P')
      || String(currentTicket.service || '').toLowerCase() === 'pedido de declaracao';
    typeEl.textContent = isPriority ? 'Atendimento Prioritario' : 'Atendimento Normal';
  }
  if (serviceEl) serviceEl.textContent = currentTicket.service;
  if (waitEl) waitEl.textContent = parseWaitMinutes(currentTicket.createdAt);
  if (issuedEl) issuedEl.textContent = formatDateTime(currentTicket.createdAt);
  if (obsEl) obsEl.textContent = currentTicket.notes || 'Sem observacoes';

  if (currentTime === 0) startTimer();
}

function renderStatsAndLog() {
  const snapshot = window.IMTSBStore.getSnapshot();
  const waiting = snapshot.queue.filter((item) => item.status === 'aguardando').length;
  const served = snapshot.history.length;

  const durations = snapshot.history
    .map((item) => Number(item.serviceDurationSec) || 0)
    .filter((v) => v > 0);
  const avgSec = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const waitingEl = document.getElementById('waitingCount');
  const servedEl = document.getElementById('servedToday');
  const avgEl = document.getElementById('avgTime');
  if (waitingEl) waitingEl.textContent = String(waiting).padStart(2, '0');
  if (servedEl) servedEl.textContent = String(served).padStart(2, '0');
  if (avgEl) avgEl.textContent = `~${Math.max(1, Math.floor(avgSec / 60))}min`;

  const log = document.getElementById('activityLog');
  if (!log) return;
  log.innerHTML = '';

  snapshot.history.slice(0, 6).forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'log-item';
    item.innerHTML = `
      <div class="log-password">${entry.code} - Concluido</div>
      <div class="log-time">${formatDateTime(entry.completedAt)} • ${formatDuration(entry.serviceDurationSec || 0)}</div>
    `;
    log.appendChild(item);
  });

  if (snapshot.history.length === 0) {
    log.innerHTML = '<p>Sem historico ainda.</p>';
  }
}

function callNextCustomer() {
  const result = window.IMTSBStore.callNext(currentSession.name);
  if (!result.ok) {
    alert(result.message);
    return;
  }

  currentTime = 0;
  isPaused = false;
  resetTimer();
  startTimer();
  renderCurrentTicket();
  renderStatsAndLog();
  showNotification(`Proximo cliente: ${result.ticket.code}`);
}

function concludeCurrent(withPrompt) {
  if (!currentTicket) {
    alert('Nenhum atendimento em andamento.');
    return;
  }
  const note = withPrompt ? (prompt('Adicionar observacao final (opcional):') || '') : '';
  const result = window.IMTSBStore.concludeCurrent(currentSession.name, note, currentTime);
  if (!result.ok) {
    alert(result.message);
    return;
  }

  resetTimer();
  isPaused = false;
  renderCurrentTicket();
  renderStatsAndLog();

  if (result.ticket && result.ticket.receipt) {
    downloadTextFile(result.ticket.receipt.fileName, result.ticket.receipt.content);
  }

  showNotification(`Atendimento ${result.ticket.code} concluido e recibo enviado.`);
}

function redirectCustomer() {
  if (!currentTicket) {
    alert('Nenhum atendimento em andamento.');
    return;
  }
  const notes = prompt('Descreva o motivo do reencaminhamento:', 'Reencaminhado para outro setor') || 'Reencaminhado';
  const result = window.IMTSBStore.redirectCurrent(currentSession.name, notes);
  if (!result.ok) {
    alert(result.message);
    return;
  }

  resetTimer();
  renderCurrentTicket();
  renderStatsAndLog();
  showNotification('Cliente reencaminhado com sucesso.');
}

function addObservation() {
  if (!currentTicket) {
    alert('Nenhum atendimento em andamento.');
    return;
  }
  const observation = prompt('Adicionar observacao:');
  if (!observation) return;
  const result = window.IMTSBStore.setCurrentNote(observation);
  if (!result.ok) {
    alert(result.message);
    return;
  }
  const obsEl = document.getElementById('obsValue');
  if (obsEl) obsEl.textContent = observation;
  showNotification('Observacao adicionada.');
}

function requestDocuments() {
  if (!currentTicket) {
    alert('Nenhum atendimento em andamento.');
    return;
  }
  const docs = currentTicket.attachments || [];
  if (docs.length === 0) {
    alert('Este usuario nao anexou documentos.');
    return;
  }
  const names = docs.map((d) => d.name).join('\n');
  alert(`Documentos anexados:\n${names}`);
}

function sendReceipt() {
  if (!currentTicket) {
    alert('Nenhum atendimento em andamento para gerar recibo.');
    return;
  }
  concludeCurrent(false);
}

function showStatistics() {
  const snapshot = window.IMTSBStore.getSnapshot();
  const waiting = snapshot.queue.filter((item) => item.status === 'aguardando').length;
  const served = snapshot.history.length;
  alert(`Estatisticas do Dia:\n• Atendidos: ${served}\n• Em espera: ${waiting}\n• Tempo atual de atendimento: ${formatDuration(currentTime)}`);
}

function sair() {
  window.IMTSBStore.logout();
}

document.addEventListener('DOMContentLoaded', () => {
  currentSession = window.IMTSBStore.requireRole(['trabalhador', 'admin']);
  if (!currentSession) return;

  const wn = document.getElementById('workerName');
  const wa = document.getElementById('workerAvatar');
  if (wn) wn.textContent = currentSession.name;
  if (wa) {
    const parts = currentSession.name.split(' ').filter(Boolean).slice(0, 2);
    wa.textContent = parts.map((p) => p[0].toUpperCase()).join('');
  }

  window.IMTSBStore.onChange(() => {
    renderCurrentTicket();
    renderStatsAndLog();
  });

  renderCurrentTicket();
  renderStatsAndLog();
});
