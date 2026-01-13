// Service para autenticação de entregadores
import api from './api';
import { Entregador } from '../types/entregador.types';

export interface LoginCredentials {
  cpf: string;
  senha: string;
}

export interface AuthResponse {
  entregador: Entregador;
  primeiroLogin: boolean;
  success: boolean;
  message?: string;
}

export interface AlterarSenhaDto {
  senhaAtual: string;
  novaSenha: string;
}

export const authService = {
  // Login do entregador usando CPF e senha
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<{ entregador: Entregador; primeiroLogin: boolean }>(
        '/entregadores/login',
        {
          cpf: credentials.cpf,
          senha: credentials.senha,
        }
      );

      return {
        entregador: response.entregador,
        primeiroLogin: response.primeiroLogin,
        success: true,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao fazer login';
      return {
        entregador: {} as Entregador,
        primeiroLogin: false,
        success: false,
        message: errorMessage,
      };
    }
  },

  // Alterar senha do entregador
  alterarSenha: async (entregadorId: number, dados: AlterarSenhaDto): Promise<boolean> => {
    try {
      await api.put(`/entregadores/${entregadorId}/alterar-senha`, dados);
      return true;
    } catch (error) {
      throw error;
    }
  },
};

