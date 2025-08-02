class BarbershopQueue {
    constructor() {
        this.queue = [];
        this.currentClientIndex = 0;
        this.totalServed = 0;
        this.totalRevenue = 0;
        this.initializeEventListeners();
        this.updateTime();
        this.loadFromLocalStorage();
    }

    initializeEventListeners() {
        // Formulário de adicionar cliente
        document.getElementById('add-client-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addClient();
        });

        // Botão limpar fila
        document.getElementById('clear-queue').addEventListener('click', () => {
            this.clearQueue();
        });

        // Atualizar hora a cada segundo
        setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
    }

    addClient() {
        const name = document.getElementById('client-name').value.trim();
        const haircutType = document.getElementById('haircut-type').value;
        const cost = parseFloat(document.getElementById('haircut-cost').value);

        if (!name || !haircutType || !cost || cost <= 0) {
            this.showToast('Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }

        const client = {
            id: Date.now(),
            name,
            haircutType,
            cost,
            status: 'waiting', // waiting, in_progress, completed
            addedAt: new Date().toISOString(),
            startedAt: null,
            finishedAt: null
        };

        this.queue.push(client);
        this.renderQueue();
        this.updateStats();
        this.saveToLocalStorage();
        
        // Limpar formulário
        document.getElementById('add-client-form').reset();
        
        this.showToast(`${name} foi adicionado à fila!`, 'success');
    }

    startService(clientId) {
        const client = this.queue.find(c => c.id === clientId);
        if (client) {
            client.status = 'in_progress';
            client.startedAt = new Date().toISOString();
            this.renderQueue();
            this.saveToLocalStorage();
            this.showToast(`Atendimento de ${client.name} iniciado!`, 'info');
        }
    }

    async finishService(clientId) {
        const client = this.queue.find(c => c.id === clientId);
        if (!client) return;

        client.status = 'completed';
        client.finishedAt = new Date().toISOString();
        
        // Enviar dados para o webhook
        try {
            await this.sendWebhookData({
                client_name: client.name,
                haircut_type: client.haircutType,
                cost: client.cost,
                timestamp: client.finishedAt,
                duration: this.calculateDuration(client.startedAt, client.finishedAt)
            });
        } catch (error) {
            console.error('Erro ao enviar webhook:', error);
        }

        // Remover da fila e atualizar estatísticas
        this.queue = this.queue.filter(c => c.id !== clientId);
        this.totalServed++;
        this.totalRevenue += client.cost;
        
        this.renderQueue();
        this.updateStats();
        this.saveToLocalStorage();
        
        this.showToast(`Atendimento de ${client.name} finalizado! R$ ${client.cost.toFixed(2)}`, 'success');
    }

    async sendWebhookData(data) {
        try {
            const response = await fetch('/webhook/appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Webhook enviado com sucesso:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro no webhook:', error);
            throw error;
        }
    }

    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return null;
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = Math.round((end - start) / 60000); // em minutos
        return duration;
    }

    removeClient(clientId) {
        this.queue = this.queue.filter(c => c.id !== clientId);
        this.renderQueue();
        this.updateStats();
        this.saveToLocalStorage();
        this.showToast('Cliente removido da fila!', 'info');
    }

    clearQueue() {
        if (this.queue.length === 0) {
            this.showToast('A fila já está vazia!', 'info');
            return;
        }

        if (confirm('Tem certeza que deseja limpar toda a fila?')) {
            this.queue = [];
            this.currentClientIndex = 0;
            this.renderQueue();
            this.updateStats();
            this.saveToLocalStorage();
            this.showToast('Fila limpa com sucesso!', 'success');
        }
    }

    renderQueue() {
        const container = document.getElementById('queue-container');
        
        if (this.queue.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-clock text-4xl mb-4"></i>
                    <p class="text-lg">Nenhum cliente na fila</p>
                    <p class="text-sm">Adicione clientes para começar o atendimento</p>
                </div>
            `;
            return;
        }

        const queueHTML = this.queue.map((client, index) => {
            const isFirst = index === 0;
            const statusIcon = this.getStatusIcon(client.status);
            const statusColor = this.getStatusColor(client.status);
            const position = index + 1;

            return `
                <div class="queue-item bg-white rounded-lg border-2 ${isFirst ? 'current-client border-blue-500' : 'border-gray-200'} p-4 ${isFirst ? 'shadow-lg' : 'shadow-sm'}">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">
                                    #${position}
                                </span>
                                ${isFirst ? '<span class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">Próximo</span>' : ''}
                            </div>
                            <h3 class="font-semibold text-lg ${isFirst ? 'text-white' : 'text-gray-800'}">${client.name}</h3>
                            <p class="text-sm ${isFirst ? 'text-blue-100' : 'text-gray-600'} mb-2">
                                <i class="fas fa-cut mr-1"></i>
                                ${client.haircutType}
                            </p>
                            <div class="flex items-center justify-between">
                                <span class="text-lg font-bold ${isFirst ? 'text-white' : 'text-green-600'}">
                                    R$ ${client.cost.toFixed(2)}
                                </span>
                                <span class="text-xs ${isFirst ? 'text-blue-100' : 'text-gray-500'}">
                                    ${new Date(client.addedAt).toLocaleTimeString('pt-BR')}
                                </span>
                            </div>
                        </div>
                        
                        <div class="flex flex-col space-y-2 ml-4">
                            ${client.status === 'waiting' ? `
                                <button onclick="barbershop.startService(${client.id})" class="btn-success text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    <i class="fas fa-play mr-1"></i>
                                    Iniciar
                                </button>
                            ` : ''}
                            
                            ${client.status === 'in_progress' ? `
                                <button onclick="barbershop.finishService(${client.id})" class="btn-warning text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    <i class="fas fa-check mr-1"></i>
                                    Finalizar
                                </button>
                            ` : ''}
                            
                            <button onclick="barbershop.removeClient(${client.id})" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <i class="fas fa-times mr-1"></i>
                                Remover
                            </button>
                        </div>
                    </div>
                    
                    ${client.status === 'in_progress' ? `
                        <div class="mt-3 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                            <i class="fas fa-clock mr-1"></i>
                            Atendimento em andamento desde ${new Date(client.startedAt).toLocaleTimeString('pt-BR')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = queueHTML;
    }

    getStatusIcon(status) {
        const icons = {
            waiting: 'fas fa-clock',
            in_progress: 'fas fa-cut',
            completed: 'fas fa-check-circle'
        };
        return icons[status] || 'fas fa-question';
    }

    getStatusColor(status) {
        const colors = {
            waiting: 'text-gray-500',
            in_progress: 'text-yellow-500',
            completed: 'text-green-500'
        };
        return colors[status] || 'text-gray-500';
    }

    updateStats() {
        document.getElementById('total-served').textContent = this.totalServed;
        document.getElementById('queue-count').textContent = this.queue.length;
        document.getElementById('total-revenue').textContent = `R$ ${this.totalRevenue.toFixed(2)}`;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        // Cores baseadas no tipo
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        // Atualizar conteúdo
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50`;
        toastMessage.innerHTML = `<i class="${icons[type]} mr-2"></i>${message}`;
        
        // Mostrar toast
        toast.style.transform = 'translateX(0)';
        
        // Esconder após 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
        }, 3000);
    }

    saveToLocalStorage() {
        const data = {
            queue: this.queue,
            totalServed: this.totalServed,
            totalRevenue: this.totalRevenue,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('barbershop-queue', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('barbershop-queue');
            if (saved) {
                const data = JSON.parse(saved);
                this.queue = data.queue || [];
                this.totalServed = data.totalServed || 0;
                this.totalRevenue = data.totalRevenue || 0;
                this.renderQueue();
                this.updateStats();
            }
        } catch (error) {
            console.error('Erro ao carregar dados salvos:', error);
        }
    }
}

// Inicializar sistema quando a página carregar
let barbershop;
document.addEventListener('DOMContentLoaded', () => {
    barbershop = new BarbershopQueue();
});