/**
 * Página pública de agendamento de serviços (barbearia)
 */

import { Suspense } from 'react';
import { getClientBySlug } from './_services/client.service';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const client = await getClientBySlug(params.slug);

  if (!client) {
    return {
      title: 'Barbearia não encontrada',
    };
  }

  return {
    title: `${client.businessName || 'Barbearia'} - Agendamento`,
    description: client.venueInfo?.description || 'Agende seu horário',
  };
}

export default async function ServicosPage({ params }: PageProps) {
  const client = await getClientBySlug(params.slug);

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Barbearia não encontrada
          </h1>
          <p className="text-sm text-gray-600">
            O link que você acessou não corresponde a nenhuma barbearia ativa.
          </p>
        </div>
      </div>
    );
  }

  const barbershopInfo = client.venueInfo?.barbershopInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {client.businessName || 'Barbearia'}
          </h1>
          {client.venueInfo?.description && (
            <p className="text-gray-600 mt-2">{client.venueInfo.description}</p>
          )}
          {client.location && (
            <p className="text-sm text-gray-500 mt-2">
              {client.location.street}, {client.location.number} - {client.location.neighborhood}
              {client.location.city && `, ${client.location.city}`}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Verifica se a barbearia está configurada */}
        {!barbershopInfo ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Configuração Pendente
            </h2>
            <p className="text-sm text-gray-600">
              Esta barbearia ainda não configurou seus serviços e profissionais.
              <br />
              Entre em contato para mais informações.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Serviços */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Serviços</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbershopInfo.services
                  .filter((s) => s.isActive)
                  .map((service) => (
                    <div
                      key={service.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-500">{service.duration} min</span>
                        <span className="text-lg font-semibold text-gray-900">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Profissionais */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profissionais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbershopInfo.professionals
                  .filter((p) => p.isActive)
                  .map((professional) => (
                    <div
                      key={professional.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-medium text-gray-900">{professional.name}</h3>
                      {professional.phone && (
                        <p className="text-sm text-gray-600 mt-1">{professional.phone}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Em desenvolvimento */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-sm text-blue-800">
                Funcionalidade de agendamento online em desenvolvimento.
                <br />
                Entre em contato por telefone ou WhatsApp para agendar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
