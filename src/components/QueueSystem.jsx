import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Plus, 
  Play, 
  Check, 
  X, 
  Trash2, 
  Settings,
  Clock,
  Users,
  DollarSign
} from 'lucide-react';
import { haircutTypesService, queueService, appointmentsService } from '../lib/supabase';

export default function QueueSystem({ onGoToAdmin }) {
  const [queue, setQueue] = useState([]);
  const [haircutTypes, setHaircutTypes] = useState([]);
  const [stats, setStats] = useState({
    totalServed: 0,
    totalRevenue: 0,
    queueCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    haircutTypeId: ''
  });

  useEffect(() => {
    loadInitialData();
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadHaircutTypes(),
      loadQueue(),
      loadStats()
    ]);
  };

  const loadHaircutTypes = async () => {
    try {
      const data = await haircutTypesService.getAll();
      setHaircutTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de corte:', error);
      showToast('Erro ao carregar tipos de corte', 'error');
    }
  };

  const loadQueue = async () => {
    try {
      const data = await queueService.getAll();
      setQueue(data);
      setStats(prev => ({ ...prev, queueCount: data.length }));
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await appointmentsService.getStats(today);
      setStats(prev => ({
        ...prev,
        totalServed: data.totalAppointments,
        totalRevenue: data.totalRevenue
      }));
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    
    if (!formData.clientName.trim() || !formData.haircutTypeId) {
      showToast('Por favor, preencha todos os campos', 'error');
      return;
    }

    setLoading(true);

    try {
      const selectedHaircut = haircutTypes.find(h => h.id === formData.haircutTypeId);
      
      await queueService.add({
        client_name: formData.clientName.trim(),
        haircut_type_id: formData.haircutTypeId,
        price: selectedHaircut.price
      });

      setFormData({ clientName: '', haircutTypeId: '' });
      loadQueue();
      showToast(`${formData.clientName} foi adicionado à fila!`, 'success');
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      showToast('Erro ao adicionar cliente à fila', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = async (queueItem) => {
    try {
      await queueService.updateStatus(queueItem.id, 'in_progress', {
        started_at: new Date().toISOString()
      });
      loadQueue();
      showToast(`Atendimento de ${queueItem.client_name} iniciado!`, 'info');
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
      showToast('Erro ao iniciar atendimento', 'error');
    }
  };

  const handleFinishService = async (queueItem) => {
    try {
      const finishedAt = new Date().toISOString();
      
      // Criar registro no histórico
      await appointmentsService.create({
        client_name: queueItem.client_name,
        haircut_type_id: queueItem.haircut_type_id,
        price: queueItem.price,
        started_at: queueItem.started_at,
        finished_at: finishedAt
      });

      // Remover da fila
      await queueService.remove(queueItem.id);

      // Enviar webhook
      await sendWebhookData({
        client_name: queueItem.client_name,
        haircut_type: queueItem.haircut_types.name,
        cost: parseFloat(queueItem.price),
        timestamp: finishedAt
      });

      loadQueue();
      loadStats();
      showToast(`Atendimento de ${queueItem.client_name} finalizado! R$ ${parseFloat(queueItem.price).toFixed(2)}`, 'success');
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      showToast('Erro ao finalizar atendimento', 'error');
    }
  };

  const handleRemoveClient = async (queueItem) => {
    if (confirm(`Remover ${queueItem.client_name} da fila?`)) {
      try {
        await queueService.remove(queueItem.id);
        loadQueue();
        showToast('Cliente removido da fila', 'info');
      } catch (error) {
        console.error('Erro ao remover cliente:', error);
        showToast('Erro ao remover cliente', 'error');
      }
    }
  };

  const handleClearQueue = async () => {
    if (queue.length === 0) {
      showToast('A fila já está vazia!', 'info');
      return;
    }

    if (confirm('Tem certeza que deseja limpar toda a fila?')) {
      try {
        await queueService.clear();
        loadQueue();
        showToast('Fila limpa com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao limpar fila:', error);
        showToast('Erro ao limpar fila', 'error');
      }
    }
  };

  const sendWebhookData = async (data) => {
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
  };

  const showToast = (message, type = 'success') => {
    // Implementação simples de toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const updateTime = () => {
    const now = new Date();
    return now.toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Scissors className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Barbearia Premium</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Sistema de Fila</p>
                <p className="text-xs text-gray-500">{updateTime()}</p>
              </div>
              <button
                onClick={onGoToAdmin}
                className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Painel Admin
              </button>
              <button
                onClick={onGoToAdmin}
                className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Painel Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Painel de Controle */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Plus className="w-5 h-5 text-blue-600 mr-2" />
                Adicionar Cliente
              </h2>
              
              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o nome..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Corte
                  </label>
                  <select
                    value={formData.haircutTypeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, haircutTypeId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione o corte</option>
                    {haircutTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - R$ {parseFloat(type.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  {loading ? 'Adicionando...' : 'Adicionar à Fila'}
                </button>
              </form>
            </div>

            {/* Estatísticas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Estatísticas do Dia</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Atendimentos:
                  </span>
                  <span className="font-bold text-blue-600">{stats.totalServed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Na Fila:
                  </span>
                  <span className="font-bold text-orange-600">{stats.queueCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Faturamento:
                  </span>
                  <span className="font-bold text-green-600">R$ {stats.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fila de Atendimento */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  Fila de Atendimento
                </h2>
                <button
                  onClick={handleClearQueue}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar Fila
                </button>
              </div>

              <div className="space-y-4">
                {queue.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Nenhum cliente na fila</p>
                    <p className="text-sm">Adicione clientes para começar o atendimento</p>
                  </div>
                ) : (
                  queue.map((item, index) => {
                    const isFirst = index === 0;
                    const position = index + 1;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border-2 p-4 transition-all ${
                          isFirst 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg' 
                            : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full mr-2 ${
                                isFirst 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                #{position}
                              </span>
                              {isFirst && (
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                                  Próximo
                                </span>
                              )}
                            </div>
                            
                            <h3 className={`font-semibold text-lg ${isFirst ? 'text-white' : 'text-gray-800'}`}>
                              {item.client_name}
                            </h3>
                            
                            <p className={`text-sm mb-2 ${isFirst ? 'text-blue-100' : 'text-gray-600'}`}>
                              <Scissors className="w-4 h-4 inline mr-1" />
                              {item.haircut_types.name}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className={`text-lg font-bold ${isFirst ? 'text-white' : 'text-green-600'}`}>
                                R$ {parseFloat(item.price).toFixed(2)}
                              </span>
                              <span className={`text-xs ${isFirst ? 'text-blue-100' : 'text-gray-500'}`}>
                                {new Date(item.added_at).toLocaleTimeString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            {item.status === 'waiting' && (
                              <button
                                onClick={() => handleStartService(item)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Iniciar
                              </button>
                            )}
                            
                            {item.status === 'in_progress' && (
                              <button
                                onClick={() => handleFinishService(item)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Finalizar
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleRemoveClient(item)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remover
                            </button>
                          </div>
                        </div>
                        
                        {item.status === 'in_progress' && (
                          <div className="mt-3 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Atendimento em andamento desde {new Date(item.started_at).toLocaleTimeString('pt-BR')}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}