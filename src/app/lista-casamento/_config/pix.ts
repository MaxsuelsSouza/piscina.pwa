/**
 * Configuração PIX para Lista de Casa Nova
 * Altere os valores abaixo com seus dados reais
 */

export const PIX_CONFIG = {
  // Chave PIX (telefone, CPF, email ou chave aleatória)
  pixKey: '81994625990', // TODO: Alterar para a chave PIX real

  // Tipo da chave: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  pixKeyType: 'phone' as const,

  // Nome do beneficiário (máximo 25 caracteres)
  merchantName: 'LISTA CASA NOVA',

  // Cidade do beneficiário (máximo 15 caracteres)
  merchantCity: 'RECIFE',
};
