// Service para autenticação de entregadores
import api from './api';
import { Entregador } from '../types/entregador.types';

export interface LoginCredentials {
  cpf: string;
  email: string;
}

export interface AuthResponse {
  entregador: Entregador;
  success: boolean;
  message?: string;
}

export const authService = {
  // Login do entregador usando CPF e Email
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Busca todos os entregadores e filtra localmente
      // Em produção, isso deveria ser um endpoint específico no backend
      const entregadores = await api.get<Entregador[]>('/entregadores');
      
      const entregador = entregadores.find(
        (e) =>
          e.cpf.replace(/\D/g, '') === credentials.cpf.replace(/\D/g, '') &&
          e.email.toLowerCase() === credentials.email.toLowerCase()
      );

      if (!entregador) {
        return {
          entregador: {} as Entregador,
          success: false,
          message: 'CPF ou Email inválidos',
        };
      }

      return {
        entregador,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      return {
        entregador: {} as Entregador,
        success: false,
        message: errorMessage,
      };
    }
  },
};

