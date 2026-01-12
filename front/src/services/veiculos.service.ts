// Service para gerenciar veículos
import api from './api';
import { Veiculo, CreateVeiculoDto, UpdateVeiculoDto } from '../types/veiculo.types';

export const veiculosService = {
  getAll: async (): Promise<Veiculo[]> => {
    return await api.get<Veiculo[]>('/veiculos');
  },
  getDisponiveis: async (): Promise<Veiculo[]> => {
    return await api.get<Veiculo[]>('/veiculos/disponiveis');
  },
  getById: async (id: number): Promise<Veiculo> => {
    return await api.get<Veiculo>(`/veiculos/${id}`);
  },
  create: async (dados: CreateVeiculoDto): Promise<Veiculo> => {
    return await api.post<Veiculo>('/veiculos', dados);
  },
  update: async (id: number, dados: UpdateVeiculoDto): Promise<Veiculo> => {
    return await api.put<Veiculo>(`/veiculos/${id}`, dados);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/veiculos/${id}`);
  },
  adicionarEntregador: async (veiculoId: number, entregadorId: number): Promise<Veiculo> => {
    return await api.post<Veiculo>(`/veiculos/${veiculoId}/entregadores/${entregadorId}`);
  },
  removerEntregador: async (veiculoId: number, entregadorId: number): Promise<void> => {
    await api.delete(`/veiculos/${veiculoId}/entregadores/${entregadorId}`);
  },
};

