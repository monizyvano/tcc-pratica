let timerInterval;
let startTime;
let isPaused = false;
let currentTime = 0;
let queue = [
    { id: 'N042', type: 'normal', service: 'Matrícula - 1º Ano', waitTime: 12 },
    { id: 'N043', type: 'priority', service: 'Pagamento de Propina', waitTime: 8 },
    { id: 'N044', type: 'normal', service: 'Entrega de Documentos', waitTime: 15 },
    { id: 'N045', type: 'normal', service: 'Consulta de Notas', waitTime: 5 }
];

let servedToday = 34;
let waitingCount = queue.length;
let activityLog = [
    { id: 'N041', action: 'Concluído', time: '14:32', duration: '7 min' },
    { id: 'N040', action: 'Concluído', time: '14:18', duration: '12 min' },
    { id: 'N039', action: 'Reencaminhado', time: '14:10', details: 'Para Tesouraria' },
    { id: 'N038', action: 'Concluído', time: '13:58', duration: '5 min' },
    { id: 'N037', action: 'Concluído', time: '13:45', duration: '9 min' }
];

// Timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!isPaused) {
        currentTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        document.getElementById('timer').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.querySelector('.btn-pause');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    if (isPaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play fa-2x"></i>Continuar';
        pauseBtn.style.background = 'linear-gradient(135deg, var(--warning-orange), #F59E0B)';
        pauseBtn.style.color = 'white';
        pauseBtn.style.border = 'none';

        statusDot.style.background = 'var(--warning-orange)';
        statusDot.style.animation = 'none';
        statusText.textContent = 'Pausado';
        statusText.style.color = 'var(--warning-orange)';
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause fa-2x"></i>Pausar';
        pauseBtn.style.background = 'white';
        pauseBtn.style.color = 'var(--accent-beige)';
        pauseBtn.style.border = '2px solid var(--accent-beige)';

        statusDot.style.background = 'var(--success-green)';
        statusDot.style.animation = 'pulse 2s infinite';
        statusText.textContent = 'Em Atendimento';
        statusText.style.color = 'var(--success-green)';

        startTime = Date.now() - (currentTime * 1000);
    }
}

// Chamar próximo cliente
function callNextCustomer() {
    if (queue.length === 0) {
        alert('Não há mais clientes na fila!');
        return;
    }

    // Registrar atendimento atual
    const currentId = document.getElementById('currentPassword').textContent;
    const duration = document.getElementById('timer').textContent;

    addToActivityLog({
        id: currentId,
        action: 'Concluído',
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        duration: duration
    });

    // Próximo cliente
    const nextCustomer = queue.shift();
    document.getElementById('currentPassword').textContent = nextCustomer.id;
    document.getElementById('waitTime').textContent = `${nextCustomer.waitTime} minutos`;

    // Atualizar contagens
    servedToday++;
    waitingCount = queue.length;

    document.getElementById('servedToday').textContent = servedToday;
    document.getElementById('waitingCount').textContent = waitingCount.toString().padStart(2, '0');

    // Resetar timer
    clearInterval(timerInterval);
    currentTime = 0;
    document.getElementById('timer').textContent = '00:00';
    startTimer();

    // Atualizar tipo de atendimento
    const passwordType = document.querySelector('.password-type');
    passwordType.textContent = nextCustomer.type === 'priority' ?
        'Atendimento Prioritário' : 'Atendimento Normal';

    // Atualizar serviço
    const serviceRow = document.querySelector('.info-row:nth-child(1) .info-value');
    serviceRow.textContent = nextCustomer.service;

    // Notificação
    showNotification(`Próximo cliente: ${nextCustomer.id}`);
}

// Reencaminhar cliente
function redirectCustomer() {
    const departments = ['Tesouraria', 'Direção Pedagógica', 'Secretaria', 'Biblioteca'];
    const randomDept = departments[Math.floor(Math.random() * departments.length)];

    const currentId = document.getElementById('currentPassword').textContent;

    addToActivityLog({
        id: currentId,
        action: 'Reencaminhado',
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        details: `Para ${randomDept}`
    });

    callNextCustomer();
    showNotification(`Cliente reencaminhado para ${randomDept}`);
}

// Adicionar ao log de atividades
function addToActivityLog(entry) {
    activityLog.unshift(entry);
    updateActivityLog();
}

function updateActivityLog() {
    const logContainer = document.getElementById('activityLog');
    logContainer.innerHTML = '';

    activityLog.slice(0, 5).forEach(entry => {
        const logItem = document.createElement('article');
        logItem.className = `log-item ${entry.action.toLowerCase()}`;

        logItem.innerHTML = `
            <div class="log-password">${entry.id} - ${entry.action}</div>
            <div class="log-time">${entry.time} • ${entry.duration || entry.details}</div>
        `;

        logContainer.appendChild(logItem);
    });
}

// Funções auxiliares
function addObservation() {
    const observation = prompt('Adicionar observação:');
    if (observation) {
        const obsRow = document.querySelector('.info-row:nth-child(4) .info-value');
        obsRow.textContent = observation;
        showNotification('Observação adicionada com sucesso!');
    }
}

function requestDocuments() {
    showNotification('Solicitação de documentos enviada!');
}

function showStatistics() {
    alert(`Estatísticas do Dia:
• Atendidos: ${servedToday}
• Em espera: ${waitingCount}
• Tempo médio: 8min
• Taxa de conclusão: 95%`);
}

function showNotification(message) {
    // Criar notificação
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
        animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    startTimer();
    updateActivityLog();

    // Adicionar estilos para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// Logout
function sair(){
    localStorage.clear();
    window.location.href = 'logintcc.html';
}
