/**
 * Serviço para consulta de CEP usando a API ViaCEP
 */

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Busca informações de endereço pelo CEP
 * @param cep - CEP no formato 12345678 ou 12345-678
 */
export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  try {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');

    // Valida se o CEP tem 8 dígitos
    if (cleanCEP.length !== 8) {
      throw new Error('CEP inválido');
    }

    // Consulta a API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }

    const data: ViaCEPResponse = await response.json();

    // Verifica se o CEP foi encontrado
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Formata o CEP no padrão 12345-678
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length <= 5) {
    return cleanCEP;
  }
  return cleanCEP.replace(/^(\d{5})(\d{1,3}).*/, '$1-$2');
}
