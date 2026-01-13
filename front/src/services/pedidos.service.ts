// Service para gerenciar pedidos
import api from './api';
import { Pedido, CreatePedidoDto, UpdatePedidoDto, UpdateLocationDto, StatusPedido } from '../types/pedido.types';

export const pedidosService = {
  // Buscar todos os pedidos
  getAll: async (): Promise<Pedido[]> => {
    return await api.get<Pedido[]>('/pedidos');
  },

  // Buscar um pedido específico
  getById: async (id: number): Promise<Pedido> => {
    return await api.get<Pedido>(`/pedidos/${id}`);
  },

  // Criar um novo pedido
  create: async (dados: CreatePedidoDto): Promise<Pedido> => {
    return await api.post<Pedido>('/pedidos', dados);
  },

  // Atualizar um pedido
  update: async (id: number, dados: UpdatePedidoDto): Promise<Pedido> => {
    return await api.put<Pedido>(`/pedidos/${id}`, dados);
  },

  // Atualizar apenas o status do pedido
  updateStatus: async (id: number, status: StatusPedido): Promise<Pedido> => {
    return await api.put<Pedido>(`/pedidos/${id}/status`, { status });
  },

  // Atualizar localização do pedido
  updateLocation: async (
    id: number,
    location: UpdateLocationDto,
  ): Promise<Pedido> => {
    return await api.put<Pedido>(`/pedidos/${id}/location`, location);
  },

  // Deletar um pedido
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pedidos/${id}`);
  },

  // Deletar pedidos por status
  deleteByStatus: async (statuses: StatusPedido[]): Promise<{ deleted: number }> => {
    const response = await api.post<{ message: string; deleted: number }>(
      '/pedidos/bulk-delete',
      { statuses }
    );
    return { deleted: response.deleted };
  },
};

