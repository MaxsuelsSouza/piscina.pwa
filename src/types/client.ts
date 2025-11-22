/**
 * Tipos para Cliente Público (autenticação customizada)
 */

export interface Client {
  phone: string; // Usado como ID único (apenas números)
  fullName: string;
  birthDate: string; // Formato: YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface ClientDocument extends Client {
  // Mesma estrutura, apenas para clareza
}

export interface ClientLoginData {
  phone: string;
  birthDate: string;
}

export interface ClientRegisterData {
  fullName: string;
  phone: string;
  birthDate: string;
}
