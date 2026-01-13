// Service para gerenciar entregadores
import api from './api';
import { Entregador, CreateEntregadorDto, UpdateEntregadorDto } from '../types/entregador.types';

export const entregadoresService = {
  // Buscar todos os entregadores
  getAll: async (): Promise<Entregador[]> => {
    return await api.get<Entregador[]>('/entregadores');
  },

  // Buscar um entregador específico
  getById: async (id: number): Promise<Entregador> => {
    return await api.get<Entregador>(`/entregadores/${id}`);
  },

  // Criar um novo entregador
  create: async (dados: CreateEntregadorDto): Promise<Entregador> => {
    return await api.post<Entregador>('/entregadores', dados);
  },

  // Atualizar um entregador
  update: async (
    id: number,
    dados: UpdateEntregadorDto,
  ): Promise<Entregador> => {
    return await api.put<Entregador>(`/entregadores/${id}`, dados);
  },

  // Deletar um entregador
  delete: async (id: number): Promise<void> => {
    await api.delete(`/entregadores/${id}`);
  },

  // Adicionar veículo ao entregador
  adicionarVeiculo: async (
    entregadorId: number,
    veiculoId: number,
  ): Promise<Entregador> => {
    return await api.post<Entregador>(
      `/entregadores/${entregadorId}/veiculos/${veiculoId}`,
    );
  },

  // Remover veículo do entregador
  removerVeiculo: async (
    entregadorId: number,
    veiculoId: number,
  ): Promise<void> => {
    await api.delete(
      `/entregadores/${entregadorId}/veiculos/${veiculoId}`,
    );
  },
};

