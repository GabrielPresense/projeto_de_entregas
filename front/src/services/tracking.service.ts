// Service para gerenciar tracking em tempo real via WebSocket
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/api';

// URL do WebSocket (mesma do backend, mas com ws://)
const getWebSocketUrl = (): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  // Converte http:// para ws:// ou https:// para wss://
  return baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
};

class TrackingService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  // Conecta ao WebSocket
  connect(): void {
    if (this.socket?.connected) {
      return; // Já está conectado
    }

    const wsUrl = getWebSocketUrl();
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Conectado ao WebSocket');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Desconectado do WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro ao conectar WebSocket:', error);
    });
  }

  // Entra no tracking de um pedido
  joinTracking(
    pedidoId: number,
    callbacks: {
      onLocationUpdate?: (data: {
        pedidoId: number;
        latitude: number;
        longitude: number;
        status: string;
        timestamp: string;
      }) => void;
      onStatusChange?: (data: {
        pedidoId: number;
        status: string;
        timestamp: string;
      }) => void;
      onError?: (error: string) => void;
    },
  ): void {
    if (!this.socket) {
      this.connect();
    }

    // Aguarda conexão antes de enviar
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.once('connect', () => {
          this.socket?.emit('join_tracking', { pedidoId });
        });
      } else {
        this.socket.emit('join_tracking', { pedidoId });
      }

      // Escuta atualizações de localização
      this.socket.on('location_updated', (data) => {
        callbacks.onLocationUpdate?.(data);
      });

      // Escuta mudanças de status
      this.socket.on('status_changed', (data) => {
        callbacks.onStatusChange?.(data);
      });

      // Escuta erros
      this.socket.on('error', (data) => {
        callbacks.onError?.(data.message || 'Erro desconhecido');
      });
    }
  }

  // Sai do tracking de um pedido
  leaveTracking(pedidoId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_tracking', { pedidoId });
    }
  }

  // Busca status atual do pedido via WebSocket
  getPedidoStatus(pedidoId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket não conectado'));
        return;
      }

      this.socket.emit('get_pedido_status', { pedidoId }, (response: any) => {
        if (response.event === 'error') {
          reject(new Error(response.message));
        } else {
          resolve(response.pedido);
        }
      });
    });
  }

  // Desconecta do WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Verifica se está conectado
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const trackingService = new TrackingService();

