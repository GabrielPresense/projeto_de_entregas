import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { Pedido, StatusPedido } from './pedido.entity';
import { Entregador } from '../entregadores/entregador.entity';
import { Rota } from '../rotas/rota.entity';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { UpdateLocationDto } from './dto/update-location.dto';

describe('PedidosService', () => {
  let service: PedidosService;
  let pedidoRepo: Repository<Pedido>;
  let trackingGateway: TrackingGateway;

  const mockPedidoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockEntregadorRepository = {
    findOne: jest.fn(),
  };

  const mockRotaRepository = {
    findOne: jest.fn(),
  };

  const mockTrackingGateway = {
    notifyStatusChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        {
          provide: getRepositoryToken(Pedido),
          useValue: mockPedidoRepository,
        },
        {
          provide: getRepositoryToken(Entregador),
          useValue: mockEntregadorRepository,
        },
        {
          provide: getRepositoryToken(Rota),
          useValue: mockRotaRepository,
        },
        {
          provide: TrackingGateway,
          useValue: mockTrackingGateway,
        },
      ],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
    pedidoRepo = module.get<Repository<Pedido>>(getRepositoryToken(Pedido));
    trackingGateway = module.get<TrackingGateway>(TrackingGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateLocation', () => {
    it('deve atualizar a localização de um pedido com sucesso', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido teste',
        latitudeAtual: null,
        longitudeAtual: null,
        status: StatusPedido.EM_TRANSITO,
      };

      const locationDto: UpdateLocationDto = {
        latitude: -23.5505,
        longitude: -46.6333,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockPedidoRepository.save.mockResolvedValue({
        ...pedidoMock,
        latitudeAtual: '-23.5505',
        longitudeAtual: '-46.6333',
        updatedAt: new Date(),
      });

      const result = await service.updateLocation(1, locationDto);

      expect(result.latitudeAtual).toBe('-23.5505');
      expect(result.longitudeAtual).toBe('-46.6333');
      expect(mockPedidoRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro quando pedido não existe', async () => {
      mockPedidoRepository.findOne.mockResolvedValue(null);

      const locationDto: UpdateLocationDto = {
        latitude: -23.5505,
        longitude: -46.6333,
      };

      await expect(service.updateLocation(999, locationDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve criar um pedido com sucesso', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido teste',
        enderecoOrigem: 'Rua A, 123',
        enderecoDestino: 'Rua B, 456',
        valor: '100.00',
        status: StatusPedido.PENDENTE,
      };

      mockPedidoRepository.create.mockReturnValue(pedidoMock);
      mockPedidoRepository.save.mockResolvedValue(pedidoMock);

      const result = await service.create({
        descricao: 'Pedido teste',
        enderecoOrigem: 'Rua A, 123',
        enderecoDestino: 'Rua B, 456',
        valor: '100.00',
      });

      expect(result).toEqual(pedidoMock);
      expect(mockPedidoRepository.create).toHaveBeenCalled();
      expect(mockPedidoRepository.save).toHaveBeenCalled();
    });

    it('deve criar pedido com entregador', async () => {
      const entregadorMock = { id: 1, nome: 'João' };
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido',
        entregador: entregadorMock,
      };

      mockEntregadorRepository.findOne.mockResolvedValue(entregadorMock);
      mockPedidoRepository.create.mockReturnValue(pedidoMock);
      mockPedidoRepository.save.mockResolvedValue(pedidoMock);

      const result = await service.create({
        descricao: 'Pedido',
        enderecoOrigem: 'Rua A',
        enderecoDestino: 'Rua B',
        valor: '100.00',
        entregadorId: 1,
      });

      expect(result.entregador).toEqual(entregadorMock);
      expect(mockEntregadorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve criar pedido com rota', async () => {
      const rotaMock = { id: 1, nome: 'Rota A' };
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido',
        rota: rotaMock,
      };

      mockRotaRepository.findOne.mockResolvedValue(rotaMock);
      mockPedidoRepository.create.mockReturnValue(pedidoMock);
      mockPedidoRepository.save.mockResolvedValue(pedidoMock);

      const result = await service.create({
        descricao: 'Pedido',
        enderecoOrigem: 'Rua A',
        enderecoDestino: 'Rua B',
        valor: '100.00',
        rotaId: 1,
      });

      expect(result.rota).toEqual(rotaMock);
      expect(mockRotaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar erro quando entregador não existe', async () => {
      mockEntregadorRepository.findOne.mockResolvedValue(null);
      mockPedidoRepository.create.mockReturnValue({ id: 1 });

      await expect(
        service.create({
          descricao: 'Pedido',
          enderecoOrigem: 'Rua A',
          enderecoDestino: 'Rua B',
          valor: '100.00',
          entregadorId: 999,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro quando rota não existe', async () => {
      mockRotaRepository.findOne.mockResolvedValue(null);
      mockPedidoRepository.create.mockReturnValue({ id: 1 });

      await expect(
        service.create({
          descricao: 'Pedido',
          enderecoOrigem: 'Rua A',
          enderecoDestino: 'Rua B',
          valor: '100.00',
          rotaId: 999,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de pedidos', async () => {
      const pedidosMock = [
        {
          id: 1,
          descricao: 'Pedido teste',
          status: StatusPedido.PENDENTE,
          entregador: null,
          rota: null,
          pagamento: null,
        },
      ];

      mockPedidoRepository.find.mockResolvedValue(pedidosMock);

      const result = await service.findAll();

      expect(result).toEqual(pedidosMock);
      expect(mockPedidoRepository.find).toHaveBeenCalledWith({
        relations: ['entregador', 'rota', 'pagamento'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um pedido existente', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido teste',
        status: StatusPedido.PENDENTE,
        entregador: null,
        rota: null,
        pagamento: null,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);

      const result = await service.findOne(1);

      expect(result).toEqual(pedidoMock);
    });

    it('deve lançar erro quando pedido não existe', async () => {
      mockPedidoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um pedido com sucesso', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido teste',
        enderecoOrigem: 'Rua A',
        enderecoDestino: 'Rua B',
        valor: '100.00',
        status: StatusPedido.PENDENTE,
        entregador: null,
        rota: null,
        pagamento: null,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockPedidoRepository.save.mockResolvedValue({
        ...pedidoMock,
        descricao: 'Pedido atualizado',
        updatedAt: new Date(),
      });

      const result = await service.update(1, { descricao: 'Pedido atualizado' });

      expect(result.descricao).toBe('Pedido atualizado');
      expect(mockPedidoRepository.save).toHaveBeenCalled();
    });

    it('deve atualizar entregador quando fornecido', async () => {
      const entregadorMock = { id: 1, nome: 'João' };
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido',
        entregador: null,
        rota: null,
        pagamento: null,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockEntregadorRepository.findOne.mockResolvedValue(entregadorMock);
      mockPedidoRepository.save.mockResolvedValue({
        ...pedidoMock,
        entregador: entregadorMock,
        updatedAt: new Date(),
      });

      const result = await service.update(1, { entregadorId: 1 });

      expect(result.entregador).toEqual(entregadorMock);
    });

    it('deve atualizar rota quando fornecido', async () => {
      const rotaMock = { id: 1, nome: 'Rota A' };
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido',
        entregador: null,
        rota: null,
        pagamento: null,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockRotaRepository.findOne.mockResolvedValue(rotaMock);
      mockPedidoRepository.save.mockResolvedValue({
        ...pedidoMock,
        rota: rotaMock,
        updatedAt: new Date(),
      });

      const result = await service.update(1, { rotaId: 1 });

      expect(result.rota).toEqual(rotaMock);
    });

    it('deve lançar erro quando entregador não existe', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido',
        entregador: null,
        rota: null,
        pagamento: null,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockEntregadorRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { entregadorId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar erro quando rota não existe', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido',
        entregador: null,
        rota: null,
        pagamento: null,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockRotaRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { rotaId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve atualizar todos os campos quando fornecidos', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido',
        enderecoOrigem: 'Rua A',
        enderecoDestino: 'Rua B',
        valor: '100.00',
        status: StatusPedido.PENDENTE,
        entregador: null,
        rota: null,
        pagamento: null,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockPedidoRepository.save.mockResolvedValue({
        ...pedidoMock,
        descricao: 'Pedido Atualizado',
        enderecoOrigem: 'Rua C',
        enderecoDestino: 'Rua D',
        valor: '150.00',
        status: StatusPedido.EM_TRANSITO,
        updatedAt: new Date(),
      });

      const result = await service.update(1, {
        descricao: 'Pedido Atualizado',
        enderecoOrigem: 'Rua C',
        enderecoDestino: 'Rua D',
        valor: '150.00',
        status: StatusPedido.EM_TRANSITO,
      });

      expect(result.descricao).toBe('Pedido Atualizado');
      expect(result.enderecoOrigem).toBe('Rua C');
      expect(result.enderecoDestino).toBe('Rua D');
      expect(result.valor).toBe('150.00');
      expect(result.status).toBe(StatusPedido.EM_TRANSITO);
    });
  });

  describe('remove', () => {
    it('deve remover um pedido com sucesso', async () => {
      mockPedidoRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockPedidoRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar erro quando pedido não existe', async () => {
      mockPedidoRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status e notificar via WebSocket', async () => {
      const pedidoMock = {
        id: 1,
        descricao: 'Pedido teste',
        status: StatusPedido.PENDENTE,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockPedidoRepository.save.mockResolvedValue({
        ...pedidoMock,
        status: StatusPedido.EM_TRANSITO,
        updatedAt: new Date(),
      });

      const result = await service.updateStatus(1, StatusPedido.EM_TRANSITO);

      expect(result.status).toBe(StatusPedido.EM_TRANSITO);
      expect(mockTrackingGateway.notifyStatusChange).toHaveBeenCalledWith(
        1,
        StatusPedido.EM_TRANSITO,
      );
    });
  });
});

