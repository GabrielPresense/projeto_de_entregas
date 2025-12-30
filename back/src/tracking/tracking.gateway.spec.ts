import { Test, TestingModule } from '@nestjs/testing';
import { TrackingGateway } from './tracking.gateway';
import { PedidosService } from '../pedidos/pedidos.service';
import { Server, Socket } from 'socket.io';
import { StatusPedido } from '../pedidos/pedido.entity';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;
  let pedidosService: PedidosService;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  const mockPedidosService = {
    updateLocation: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingGateway,
        {
          provide: PedidosService,
          useValue: mockPedidosService,
        },
      ],
    }).compile();

    gateway = module.get<TrackingGateway>(TrackingGateway);
    pedidosService = module.get<PedidosService>(PedidosService);

    // Mock do Socket.IO Server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    gateway.server = mockServer as Server;

    // Mock do Socket
    mockSocket = {
      id: 'test-client-id',
      join: jest.fn(),
      leave: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('deve logar conexão do cliente', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      gateway.handleConnection(mockSocket as Socket);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Cliente conectado: ${mockSocket.id}`,
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('deve logar desconexão do cliente', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      gateway.handleDisconnect(mockSocket as Socket);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Cliente desconectado: ${mockSocket.id}`,
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleJoinTracking', () => {
    it('deve adicionar cliente à sala de tracking', () => {
      const data = { pedidoId: 1 };

      const result = gateway.handleJoinTracking(
        mockSocket as Socket,
        data,
      );

      expect(mockSocket.join).toHaveBeenCalledWith('pedido_1');
      expect(result).toEqual({ event: 'joined', pedidoId: 1 });
    });
  });

  describe('handleLeaveTracking', () => {
    it('deve remover cliente da sala de tracking', () => {
      const data = { pedidoId: 1 };

      const result = gateway.handleLeaveTracking(
        mockSocket as Socket,
        data,
      );

      expect(mockSocket.leave).toHaveBeenCalledWith('pedido_1');
      expect(result).toEqual({ event: 'left', pedidoId: 1 });
    });
  });

  describe('handleUpdateLocation', () => {
    it('deve atualizar localização e emitir evento', async () => {
      const data = {
        pedidoId: 1,
        latitude: -23.5505,
        longitude: -46.6333,
      };

      const pedidoMock = {
        id: 1,
        latitudeAtual: '-23.5505',
        longitudeAtual: '-46.6333',
        status: StatusPedido.EM_TRANSITO,
      };

      mockPedidosService.updateLocation.mockResolvedValue(pedidoMock);

      const result = await gateway.handleUpdateLocation(data);

      expect(pedidosService.updateLocation).toHaveBeenCalledWith(1, {
        latitude: data.latitude,
        longitude: data.longitude,
      });

      expect(mockServer.to).toHaveBeenCalledWith('pedido_1');
      expect(mockServer.emit).toHaveBeenCalledWith('location_updated', {
        pedidoId: 1,
        latitude: -23.5505,
        longitude: -46.6333,
        status: StatusPedido.EM_TRANSITO,
        timestamp: expect.any(String),
      });

      expect(result).toEqual({
        event: 'location_updated',
        pedidoId: 1,
        success: true,
      });
    });

    it('deve retornar erro quando falhar', async () => {
      const data = {
        pedidoId: 1,
        latitude: -23.5505,
        longitude: -46.6333,
      };

      mockPedidosService.updateLocation.mockRejectedValue(
        new Error('Pedido não encontrado'),
      );

      const result = await gateway.handleUpdateLocation(data);

      expect(result).toEqual({
        event: 'error',
        message: 'Pedido não encontrado',
      });
    });
  });

  describe('handleGetPedidoStatus', () => {
    it('deve retornar status do pedido', async () => {
      const data = { pedidoId: 1 };

      const pedidoMock = {
        id: 1,
        status: StatusPedido.EM_TRANSITO,
        latitudeAtual: '-23.5505',
        longitudeAtual: '-46.6333',
        entregador: {
          id: 1,
          nome: 'João',
        },
      };

      mockPedidosService.findOne.mockResolvedValue(pedidoMock);

      const result = await gateway.handleGetPedidoStatus(data);

      expect(pedidosService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        event: 'pedido_status',
        pedido: {
          id: 1,
          status: StatusPedido.EM_TRANSITO,
          latitude: -23.5505,
          longitude: -46.6333,
          entregador: {
            id: 1,
            nome: 'João',
          },
        },
      });
    });

    it('deve retornar null para coordenadas quando não existem', async () => {
      const data = { pedidoId: 1 };

      const pedidoMock = {
        id: 1,
        status: StatusPedido.PENDENTE,
        latitudeAtual: null,
        longitudeAtual: null,
        entregador: null,
      };

      mockPedidosService.findOne.mockResolvedValue(pedidoMock);

      const result = await gateway.handleGetPedidoStatus(data);

      expect(result).toEqual({
        event: 'pedido_status',
        pedido: {
          id: 1,
          status: StatusPedido.PENDENTE,
          latitude: null,
          longitude: null,
          entregador: null,
        },
      });
    });

    it('deve retornar erro quando falhar', async () => {
      const data = { pedidoId: 999 };

      mockPedidosService.findOne.mockRejectedValue(
        new Error('Pedido não encontrado'),
      );

      const result = await gateway.handleGetPedidoStatus(data);

      expect(result).toEqual({
        event: 'error',
        message: 'Pedido não encontrado',
      });
    });
  });

  describe('notifyStatusChange', () => {
    it('deve emitir evento de mudança de status', async () => {
      await gateway.notifyStatusChange(1, StatusPedido.EM_TRANSITO);

      expect(mockServer.to).toHaveBeenCalledWith('pedido_1');
      expect(mockServer.emit).toHaveBeenCalledWith('status_changed', {
        pedidoId: 1,
        status: StatusPedido.EM_TRANSITO,
        timestamp: expect.any(String),
      });
    });
  });
});

