// Service para gerenciar pagamentos
import api from './api';
import { Pagamento, CreatePagamentoDto, UpdatePagamentoDto } from '../types/pagamento.types';

export const pagamentosService = {
  getAll: async (): Promise<Pagamento[]> => {
    return await api.get<Pagamento[]>('/pagamentos');
  },
  getById: async (id: number): Promise<Pagamento> => {
    return await api.get<Pagamento>(`/pagamentos/${id}`);
  },
  create: async (dados: CreatePagamentoDto): Promise<Pagamento> => {
    return await api.post<Pagamento>('/pagamentos', dados);
  },
  update: async (id: number, dados: UpdatePagamentoDto): Promise<Pagamento> => {
    return await api.put<Pagamento>(`/pagamentos/${id}`, dados);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pagamentos/${id}`);
  },
  // Processa o pagamento (gera QR Code para PIX)
  processar: async (id: number, emailPagador?: string): Promise<Pagamento> => {
    return await api.post<Pagamento>(`/pagamentos/${id}/processar`, {
      emailPagador: emailPagador || undefined,
    });
  },
  // Consulta o status do pagamento no Mercado Pago
  consultarStatus: async (id: number): Promise<Pagamento> => {
    return await api.get<Pagamento>(`/pagamentos/${id}/status`);
  },
};

