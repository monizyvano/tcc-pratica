   function updateDate() {
            const now = new Date();
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            document.getElementById('currentDate').textContent = 
                now.toLocaleDateString('pt-PT', options);
        }

        // Exportar dados
        function exportData() {
            const data = {
                kpis: {
                    atendimentos: 187,
                    tempoMedio: '12min',
                    ocupacao: '87%',
                    satisfacao: '94%'
                },
                timestamp: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_imtsb_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Dados exportados com sucesso!');
        }

        // Gráficos
        let lineChart, barChart, pieChart;

        function initCharts() {
            // Gráfico de Linha
            const lineCtx = document.getElementById('lineChart').getContext('2d');
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                    datasets: [{
                        label: 'Atendimentos',
                        data: [142, 167, 178, 156, 187, 124],
                        borderColor: '#8C6746',
                        backgroundColor: 'rgba(140, 103, 70, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: { 
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    }
                }
            });

            // Gráfico de Barras
            const barCtx = document.getElementById('barChart').getContext('2d');
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['08h', '09h', '10h', '11h', '12h', '14h', '15h', '16h'],
                    datasets: [{
                        label: 'Atendimentos',
                        data: [12, 28, 35, 42, 38, 31, 29, 22],
                        backgroundColor: 'rgba(191, 167, 153, 0.8)',
                        borderRadius: 8,
                        borderColor: 'rgba(191, 167, 153, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: { 
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    }
                }
            });

            // Gráfico de Pizza
            const pieCtx = document.getElementById('pieChart').getContext('2d');
            pieChart = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Normal', 'Prioritário', 'Agendado'],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: [
                            'rgba(140, 103, 70, 0.8)',
                            'rgba(191, 167, 153, 0.8)',
                            'rgba(38, 5, 5, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: { size: 12 },
                                color: '#401903'
                            }
                        }
                    }
                }
            });
        }

        // Mudar período do gráfico
        function changeChartPeriod(period) {
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Aqui você atualizaria os dados do gráfico baseado no período
            console.log('Período mudado para:', period);
        }

        // Simular dados em tempo real
        function simulateRealTimeData() {
            setInterval(() => {
                // Atualizar números das filas aleatoriamente
                const queueNumbers = document.querySelectorAll('.queue-number');
                queueNumbers.forEach(num => {
                    const current = parseInt(num.textContent);
                    const change = Math.floor(Math.random() * 3) - 1; // -1, 0, ou 1
                    const newValue = Math.max(0, current + change);
                    num.textContent = newValue.toString().padStart(2, '0');
                    
                    // Atualizar contagem de pessoas
                    const countElement = num.parentElement.querySelector('.queue-count');
                    countElement.textContent = `${newValue} pessoas aguardando`;
                });
                
                // Atualizar KPIs aleatoriamente
                const kpiValues = document.querySelectorAll('.kpi-value');
                kpiValues.forEach((value, index) => {
                    if (index === 0) { // Atendimentos
                        const current = parseInt(value.textContent);
                        const change = Math.floor(Math.random() * 5);
                        value.textContent = (current + change).toString();
                    }
                });
            }, 5000); // Atualizar a cada 5 segundos
        }

        // Inicialização
        document.addEventListener('DOMContentLoaded', () => {
            updateDate();
            initCharts();
            simulateRealTimeData();
            
            // Adicionar animações aos cards
            const cards = document.querySelectorAll('.kpi-card, .monitor-card, .chart-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 * index);
            });
        });
    // (o teu dashadm.js original permanece igual aqui em cima)
// ...

// Logout
/* (o teu dashadm.js original aqui em cima...) */

// Logout
function sair(){
    localStorage.clear();
    window.location.href = 'logintcc.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnSairAdmin');
    if (btn) btn.addEventListener('click', sair);
});
