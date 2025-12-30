import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PedidosService } from '../pedidos/pedidos.service';
import { UpdateLocationDto } from '../pedidos/dto/update-location.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(forwardRef(() => PedidosService))
    private readonly pedidosService: PedidosService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_tracking')
  handleJoinTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pedidoId: number },
  ) {
    client.join(`pedido_${data.pedidoId}`);
    console.log(`Cliente ${client.id} entrou no tracking do pedido ${data.pedidoId}`);
    return { event: 'joined', pedidoId: data.pedidoId };
  }

  @SubscribeMessage('leave_tracking')
  handleLeaveTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pedidoId: number },
  ) {
    client.leave(`pedido_${data.pedidoId}`);
    console.log(`Cliente ${client.id} saiu do tracking do pedido ${data.pedidoId}`);
    return { event: 'left', pedidoId: data.pedidoId };
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @MessageBody() data: { pedidoId: number; latitude: number; longitude: number },
  ) {
    try {
      const location: UpdateLocationDto = {
        latitude: data.latitude,
        longitude: data.longitude,
      };
      const pedido = await this.pedidosService.updateLocation(
        data.pedidoId,
        location,
      );

      // Emite a atualização para todos os clientes que estão rastreando este pedido
      this.server.to(`pedido_${data.pedidoId}`).emit('location_updated', {
        pedidoId: pedido.id,
        latitude: parseFloat(pedido.latitudeAtual || '0'),
        longitude: parseFloat(pedido.longitudeAtual || '0'),
        status: pedido.status,
        timestamp: new Date().toISOString(),
      });

      return {
        event: 'location_updated',
        pedidoId: pedido.id,
        success: true,
      };
    } catch (error) {
      return {
        event: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @SubscribeMessage('get_pedido_status')
  async handleGetPedidoStatus(@MessageBody() data: { pedidoId: number }) {
    try {
      const pedido = await this.pedidosService.findOne(data.pedidoId);
      return {
        event: 'pedido_status',
        pedido: {
          id: pedido.id,
          status: pedido.status,
          latitude: pedido.latitudeAtual
            ? parseFloat(pedido.latitudeAtual)
            : null,
          longitude: pedido.longitudeAtual
            ? parseFloat(pedido.longitudeAtual)
            : null,
          entregador: pedido.entregador
            ? {
                id: pedido.entregador.id,
                nome: pedido.entregador.nome,
              }
            : null,
        },
      };
    } catch (error) {
      return {
        event: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Método para notificar mudanças de status do pedido
  async notifyStatusChange(pedidoId: number, status: string) {
    this.server.to(`pedido_${pedidoId}`).emit('status_changed', {
      pedidoId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}

