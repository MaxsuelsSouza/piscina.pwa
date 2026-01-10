/**
 * Componente para gerenciar profissionais (barbeiros)
 */

'use client';

import { useState } from 'react';
import type { Professional, Service } from '@/types/barbershop';

interface ProfessionalsManagerProps {
  professionals: Professional[];
  availableServices: Service[];
  onChange: (professionals: Professional[]) => void;
}

export function ProfessionalsManager({
  professionals,
  availableServices,
  onChange,
}: ProfessionalsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    serviceIds: [] as string[],
  });

  const handleAdd = () => {
    if (!formData.name) {
      alert('Preencha o nome do profissional');
      return;
    }

    const newProfessional: Professional = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      services: formData.serviceIds,
      isActive: true,
    };

    onChange([...professionals, newProfessional]);
    resetForm();
  };

  const handleEdit = (professional: Professional) => {
    setEditingId(professional.id);
    setFormData({
      name: professional.name,
      phone: professional.phone || '',
      serviceIds: professional.services,
    });
    setShowForm(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;

    const updated = professionals.map((p) =>
      p.id === editingId
        ? { ...p, name: formData.name, phone: formData.phone, services: formData.serviceIds }
        : p
    );
    onChange(updated);
    resetForm();
  };

  const handleToggleActive = (id: string) => {
    const updated = professionals.map((p) =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este profissional?')) {
      onChange(professionals.filter((p) => p.id !== id));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData({
      ...formData,
      serviceIds: formData.serviceIds.includes(serviceId)
        ? formData.serviceIds.filter((id) => id !== serviceId)
        : [...formData.serviceIds, serviceId],
    });
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', serviceIds: [] });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">Profissionais</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Adicionar Profissional'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Nome do Profissional *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Telefone/WhatsApp
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {availableServices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Serviços que este profissional oferece
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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

      {professionals.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          Nenhum profissional cadastrado
        </div>
      ) : (
        <div className="space-y-2">
          {professionals.map((professional) => {
            const professionalServices = availableServices.filter((s) =>
              professional.services.includes(s.id)
            );

            return (
              <div
                key={professional.id}
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{professional.name}</h4>
                    {!professional.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                  {professional.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{professional.phone}</p>
                  )}
                  {professionalServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {professionalServices.map((service) => (
                        <span
                          key={service.id}
                          className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(professional)}
                    className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(professional.id)}
                    className="px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {professional.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(professional.id)}
                    className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
