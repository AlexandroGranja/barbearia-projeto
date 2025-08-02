import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Settings, 
  Users, 
  Scissors, 
  BarChart3, 
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { adminService, haircutTypesService, appointmentsService } from '../lib/supabase';

export default function AdminPanel({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('haircuts');
  const [haircutTypes, setHaircutTypes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingHaircut, setEditingHaircut] = useState(null);
  const [newHaircut, setNewHaircut] = useState({
    name: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    loadHaircutTypes();
    loadStats();
  }, []);

  const loadHaircutTypes = async () => {
    try {
      const data = await haircutTypesService.getAll();
      setHaircutTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de corte:', error);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await appointmentsService.getStats(today);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCreateHaircut = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await haircutTypesService.create({
        name: newHaircut.name,
        price: parseFloat(newHaircut.price),
        description: newHaircut.description
      });
      
      setNewHaircut({ name: '', price: '', description: '' });
      loadHaircutTypes();
    } catch (error) {
      console.error('Erro ao criar tipo de corte:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHaircut = async (id, updates) => {
    try {
      await haircutTypesService.update(id, {
        ...updates,
        price: parseFloat(updates.price)
      });
      loadHaircutTypes();
      setEditingHaircut(null);
    } catch (error) {
      console.error('Erro ao atualizar tipo de corte:', error);
    }
  };

  const handleDeleteHaircut = async (id) => {
    if (confirm('Tem certeza que deseja excluir este tipo de corte?')) {
      try {
        await haircutTypesService.delete(id);
        loadHaircutTypes();
      } catch (error) {
        console.error('Erro ao excluir tipo de corte:', error);
      }
    }
  };

  const tabs = [
    { id: 'haircuts', label: 'Tipos de Corte', icon: Scissors },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Scissors className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Painel Administrativo
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {session.name}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'haircuts' && (
          <div className="space-y-8">
            {/* Adicionar novo tipo de corte */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Adicionar Novo Tipo de Corte
              </h2>
              
              <form onSubmit={handleCreateHaircut} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Corte
                  </label>
                  <input
                    type="text"
                    value={newHaircut.name}
                    onChange={(e) => setNewHaircut(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Corte Degradê"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newHaircut.price}
                    onChange={(e) => setNewHaircut(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={newHaircut.description}
                    onChange={(e) => setNewHaircut(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrição opcional"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Adicionar
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de tipos de corte */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Tipos de Corte Cadastrados
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {haircutTypes.map((haircut) => (
                      <tr key={haircut.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingHaircut?.id === haircut.id ? (
                            <input
                              type="text"
                              value={editingHaircut.name}
                              onChange={(e) => setEditingHaircut(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">
                              {haircut.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingHaircut?.id === haircut.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingHaircut.price}
                              onChange={(e) => setEditingHaircut(prev => ({ ...prev, price: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <div className="text-sm text-gray-900">
                              R$ {parseFloat(haircut.price).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingHaircut?.id === haircut.id ? (
                            <input
                              type="text"
                              value={editingHaircut.description || ''}
                              onChange={(e) => setEditingHaircut(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">
                              {haircut.description || '-'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingHaircut?.id === haircut.id ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleUpdateHaircut(haircut.id, editingHaircut)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingHaircut(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingHaircut(haircut)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteHaircut(haircut.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Atendimentos Hoje
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalAppointments || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Faturamento Hoje
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    R$ {(stats.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Scissors className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Ticket Médio
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    R$ {(stats.averagePrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Configurações do Sistema
            </h2>
            <p className="text-gray-600">
              Configurações avançadas em desenvolvimento...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}