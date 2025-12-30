import { Test, TestingModule } from '@nestjs/testing';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { UpdatePagamentoDto } from './dto/update-pagamento.dto';
import { MetodoPagamento, StatusPagamento } from './pagamento.entity';

describe('PagamentosController', () => {
  let controller: PagamentosController;
  let service: PagamentosService;

  const mockPagamentosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    processarPagamento: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagamentosController],
      providers: [
        {
          provide: PagamentosService,
          useValue: mockPagamentosService,
        },
      ],
    }).compile();

    controller = module.get<PagamentosController>(PagamentosController);
    service = module.get<PagamentosService>(PagamentosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um pagamento', async () => {
      const dto: CreatePagamentoDto = {
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        pedidoId: 1,
      };

      const expected = { id: 1, ...dto, status: StatusPagamento.PENDENTE };

      mockPagamentosService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('processar', () => {
    it('deve processar um pagamento', async () => {
      const expected = { id: 1, status: StatusPagamento.PROCESSANDO };

      mockPagamentosService.processarPagamento.mockResolvedValue(expected);

      const result = await controller.processar(1);

      expect(result).toEqual(expected);
      expect(service.processarPagamento).toHaveBeenCalledWith(1);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de pagamentos', async () => {
      const expected = [{ id: 1, valor: '100.00' }];

      mockPagamentosService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um pagamento', async () => {
      const expected = { id: 1, valor: '100.00' };

      mockPagamentosService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(result).toEqual(expected);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('deve atualizar um pagamento', async () => {
      const dto: UpdatePagamentoDto = { valor: '150.00' };
      const expected = { id: 1, valor: '150.00' };

      mockPagamentosService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('deve remover um pagamento', async () => {
      mockPagamentosService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Pagamento removido com sucesso' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});

