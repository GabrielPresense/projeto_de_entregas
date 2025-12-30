import { Test, TestingModule } from '@nestjs/testing';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { StatusPedido } from './pedido.entity';

describe('PedidosController', () => {
  let controller: PedidosController;
  let service: PedidosService;

  const mockPedidosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
    updateLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        {
          provide: PedidosService,
          useValue: mockPedidosService,
        },
      ],
    }).compile();

    controller = module.get<PedidosController>(PedidosController);
    service = module.get<PedidosService>(PedidosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um pedido', async () => {
      const dto: CreatePedidoDto = {
        descricao: 'Pedido teste',
        enderecoOrigem: 'Rua A',
        enderecoDestino: 'Rua B',
        valor: '100.00',
      };

      const expected = { id: 1, ...dto, status: StatusPedido.PENDENTE };

      mockPedidosService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de pedidos', async () => {
      const expected = [{ id: 1, descricao: 'Pedido' }];

      mockPedidosService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um pedido', async () => {
      const expected = { id: 1, descricao: 'Pedido' };

      mockPedidosService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(result).toEqual(expected);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('deve atualizar um pedido', async () => {
      const dto: UpdatePedidoDto = { descricao: 'Pedido Atualizado' };
      const expected = { id: 1, descricao: 'Pedido Atualizado' };

      mockPedidosService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status do pedido', async () => {
      const expected = { id: 1, status: StatusPedido.EM_TRANSITO };

      mockPedidosService.updateStatus.mockResolvedValue(expected);

      const result = await controller.updateStatus(1, {
        status: StatusPedido.EM_TRANSITO,
      });

      expect(result).toEqual(expected);
      expect(service.updateStatus).toHaveBeenCalledWith(
        1,
        StatusPedido.EM_TRANSITO,
      );
    });
  });

  describe('updateLocation', () => {
    it('deve atualizar localização do pedido', async () => {
      const dto: UpdateLocationDto = {
        latitude: -23.5505,
        longitude: -46.6333,
      };

      const expected = { id: 1, ...dto };

      mockPedidosService.updateLocation.mockResolvedValue(expected);

      const result = await controller.updateLocation(1, dto);

      expect(result).toEqual(expected);
      expect(service.updateLocation).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('deve remover um pedido', async () => {
      mockPedidosService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Pedido removido com sucesso' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});

