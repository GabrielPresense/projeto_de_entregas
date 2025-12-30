import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import {
  Pagamento,
  StatusPagamento,
  MetodoPagamento,
} from './pagamento.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';

describe('PagamentosService', () => {
  let service: PagamentosService;
  let pagamentoRepo: Repository<Pagamento>;
  let pedidoRepo: Repository<Pedido>;

  const mockPagamentoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockPedidoRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagamentosService,
        {
          provide: getRepositoryToken(Pagamento),
          useValue: mockPagamentoRepository,
        },
        {
          provide: getRepositoryToken(Pedido),
          useValue: mockPedidoRepository,
        },
      ],
    }).compile();

    service = module.get<PagamentosService>(PagamentosService);
    pagamentoRepo = module.get<Repository<Pagamento>>(
      getRepositoryToken(Pagamento),
    );
    pedidoRepo = module.get<Repository<Pedido>>(getRepositoryToken(Pedido));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um pagamento com sucesso', async () => {
      const pedidoMock = { id: 1, descricao: 'Pedido teste' };
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: pedidoMock,
      };

      mockPedidoRepository.findOne.mockResolvedValue(pedidoMock);
      mockPagamentoRepository.create.mockReturnValue(pagamentoMock);
      mockPagamentoRepository.save.mockResolvedValue(pagamentoMock);

      const dto: CreatePagamentoDto = {
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        pedidoId: 1,
      };

      const result = await service.create(dto);

      expect(result).toEqual(pagamentoMock);
      expect(mockPedidoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPagamentoRepository.create).toHaveBeenCalled();
      expect(mockPagamentoRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro quando pedido não existe', async () => {
      mockPedidoRepository.findOne.mockResolvedValue(null);

      const dto: CreatePagamentoDto = {
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        pedidoId: 999,
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Pedido não encontrado',
      );
    });
  });

  describe('processarPagamento', () => {
    it('deve processar pagamento e mudar status para PROCESSANDO', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);
      mockPagamentoRepository.save.mockResolvedValue({
        ...pagamentoMock,
        status: StatusPagamento.PROCESSANDO,
      });

      const result = await service.processarPagamento(1);

      expect(result.status).toBe(StatusPagamento.PROCESSANDO);
      expect(mockPagamentoRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro quando pagamento não existe', async () => {
      mockPagamentoRepository.findOne.mockResolvedValue(null);

      await expect(service.processarPagamento(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de pagamentos', async () => {
      const pagamentosMock = [
        {
          id: 1,
          valor: '100.00',
          metodoPagamento: MetodoPagamento.PIX,
          status: StatusPagamento.PENDENTE,
          pedido: { id: 1 },
        },
      ];

      mockPagamentoRepository.find.mockResolvedValue(pagamentosMock);

      const result = await service.findAll();

      expect(result).toEqual(pagamentosMock);
      expect(mockPagamentoRepository.find).toHaveBeenCalledWith({
        relations: ['pedido'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um pagamento existente', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);

      const result = await service.findOne(1);

      expect(result).toEqual(pagamentoMock);
    });

    it('deve lançar erro quando pagamento não existe', async () => {
      mockPagamentoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um pagamento com sucesso', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);
      mockPagamentoRepository.save.mockResolvedValue({
        ...pagamentoMock,
        valor: '150.00',
      });

      const result = await service.update(1, { valor: '150.00' });

      expect(result.valor).toBe('150.00');
      expect(mockPagamentoRepository.save).toHaveBeenCalled();
    });

    it('deve definir processedAt quando status é APROVADO', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        status: StatusPagamento.PENDENTE,
        processedAt: null,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);
      mockPagamentoRepository.save.mockResolvedValue({
        ...pagamentoMock,
        status: StatusPagamento.APROVADO,
        processedAt: new Date(),
      });

      const result = await service.update(1, {
        status: StatusPagamento.APROVADO,
      });

      expect(result.status).toBe(StatusPagamento.APROVADO);
      expect(result.processedAt).toBeDefined();
    });

    it('deve atualizar metodoPagamento quando fornecido', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);
      mockPagamentoRepository.save.mockResolvedValue({
        ...pagamentoMock,
        metodoPagamento: MetodoPagamento.CARTAO,
      });

      const result = await service.update(1, {
        metodoPagamento: MetodoPagamento.CARTAO,
      });

      expect(result.metodoPagamento).toBe(MetodoPagamento.CARTAO);
    });

    it('deve atualizar transacaoId quando fornecido', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        transacaoId: null,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);
      mockPagamentoRepository.save.mockResolvedValue({
        ...pagamentoMock,
        transacaoId: 'tx_123456',
      });

      const result = await service.update(1, {
        transacaoId: 'tx_123456',
      });

      expect(result.transacaoId).toBe('tx_123456');
    });
  });

  describe('remove', () => {
    it('deve remover um pagamento com sucesso', async () => {
      mockPagamentoRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockPagamentoRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar erro quando pagamento não existe', async () => {
      mockPagamentoRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});

