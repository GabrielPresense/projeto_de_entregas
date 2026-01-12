// Service para gerenciar rotas
import api from './api';
import { Rota, CreateRotaDto, UpdateRotaDto } from '../types/rota.types';

export const rotasService = {
  getAll: async (): Promise<Rota[]> => {
    return await api.get<Rota[]>('/rotas');
  },
  getById: async (id: number): Promise<Rota> => {
    return await api.get<Rota>(`/rotas/${id}`);
  },
  create: async (dados: CreateRotaDto): Promise<Rota> => {
    return await api.post<Rota>('/rotas', dados);
  },
  update: async (id: number, dados: UpdateRotaDto): Promise<Rota> => {
    return await api.put<Rota>(`/rotas/${id}`, dados);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/rotas/${id}`);
  },
};

