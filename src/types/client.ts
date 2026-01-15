/**
 * Tipos para Cliente Público (autenticação customizada)
 */

export interface Client {
  phone: string; // Usado como ID único (apenas números)
  fullName?: string;
  birthDate?: string; // Formato: YYYY-MM-DD (opcional agora)
  passwordHash?: string; // Hash da senha para autenticação
  createdAt: string;
  updatedAt: string;
}

export interface ClientDocument extends Client {
  // Mesma estrutura, apenas para clareza
}

export interface ClientLoginData {
  phone: string;
  password: string;
}

export interface ClientRegisterData {
  phone: string;
  password: string;
}
