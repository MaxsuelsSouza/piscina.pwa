/**
 * Componente para gerenciar serviços da barbearia
 */

'use client';

import { useState } from 'react';
import type { Service } from '@/types/barbershop';

interface ServicesManagerProps {
  services: Service[];
  onChange: (services: Service[]) => void;
}

export function ServicesManager({ services, onChange }: ServicesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
  });

  const handleAdd = () => {
    if (!formData.name || formData.price <= 0) {
      alert('Preencha nome e preço válidos');
      return;
    }

    const newService: Service = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      duration: formData.duration,
      price: formData.price,
      isActive: true,
    };

    onChange([...services, newService]);
    resetForm();
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
    });
    setShowForm(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;

    const updated = services.map((s) =>
      s.id === editingId
        ? { ...s, ...formData }
        : s
    );
    onChange(updated);
    resetForm();
  };

  const handleToggleActive = (id: string) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este serviço?')) {
      onChange(services.filter((s) => s.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', duration: 30, price: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">Serviços</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Adicionar Serviço'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Nome do Serviço *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                placeholder="Corte Masculino"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                placeholder="35.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
              placeholder="Corte tradicional com máquina e tesoura"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Duração (minutos) *
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h 30min</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700"
            >
              {editingId ? 'Atualizar' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          Nenhum serviço cadastrado
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{service.name}</h4>
                  {!service.isActive && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                      Inativo
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span>{service.duration} min</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(service)}
                  className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(service.id)}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {service.isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(service.id)}
                  className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
