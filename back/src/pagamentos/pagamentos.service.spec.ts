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
import { MercadoPagoService } from './mercado-pago.service';

describe('PagamentosService', () => {
  let service: PagamentosService;
  let pagamentoRepo: Repository<Pagamento>;
  let pedidoRepo: Repository<Pedido>;
  let mercadoPagoService: MercadoPagoService;

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

  const mockMercadoPagoService = {
    criarPagamentoPix: jest.fn(),
    consultarPagamento: jest.fn(),
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
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
      ],
    }).compile();

    service = module.get<PagamentosService>(PagamentosService);
    pagamentoRepo = module.get<Repository<Pagamento>>(
      getRepositoryToken(Pagamento),
    );
    pedidoRepo = module.get<Repository<Pedido>>(getRepositoryToken(Pedido));
    mercadoPagoService = module.get<MercadoPagoService>(MercadoPagoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Resetar todos os mocks para estado inicial
    mockPagamentoRepository.findOne.mockReset();
    mockPagamentoRepository.save.mockReset();
    mockMercadoPagoService.criarPagamentoPix.mockReset();
    mockMercadoPagoService.consultarPagamento.mockReset();
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
    it('deve processar pagamento PIX e criar QR Code', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };

      const mercadoPagoResponse = {
        id: '123456789',
        status: 'pending',
        point_of_interaction: {
          transaction_data: {
            qr_code: '00020126360014BR.GOV.BCB.PIX0114+5511999999999...',
            qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAA...',
            ticket_url: 'https://www.mercadopago.com.br/payments/123456789/ticket',
          },
        },
      };

      mockPagamentoRepository.findOne
        .mockResolvedValueOnce(pagamentoMock)
        .mockResolvedValueOnce({
          ...pagamentoMock,
          status: StatusPagamento.PROCESSANDO,
        });

      mockMercadoPagoService.criarPagamentoPix.mockResolvedValue(
        mercadoPagoResponse,
      );

      mockPagamentoRepository.save.mockResolvedValue({
        ...pagamentoMock,
        status: StatusPagamento.PENDENTE,
        transacaoId: '123456789',
        qrCode: mercadoPagoResponse.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64:
          mercadoPagoResponse.point_of_interaction.transaction_data.qr_code_base64,
        ticketUrl:
          mercadoPagoResponse.point_of_interaction.transaction_data.ticket_url,
      });

      const result = await service.processarPagamento(1);

      expect(result.status).toBe(StatusPagamento.PENDENTE);
      expect(result.transacaoId).toBe('123456789');
      expect(result.qrCode).toBeDefined();
      expect(result.qrCodeBase64).toBeDefined();
      expect(result.ticketUrl).toBeDefined();
      expect(mockMercadoPagoService.criarPagamentoPix).toHaveBeenCalledWith(
        100.0,
        'Pagamento pedido #1',
      );
    });

    it('deve processar pagamento não-PIX normalmente', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };

      const pagamentoProcessando = {
        ...pagamentoMock,
        status: StatusPagamento.PROCESSANDO,
      };

      // findOne retorna o pagamento original
      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);
      // save retorna o pagamento com status PROCESSANDO
      mockPagamentoRepository.save.mockImplementation((pagamento) => {
        return Promise.resolve({
          ...pagamento,
          status: StatusPagamento.PROCESSANDO,
        });
      });

      const result = await service.processarPagamento(1);

      // Para não-PIX, retorna com status PROCESSANDO (o timer aprova depois assincronamente)
      expect(result.status).toBe(StatusPagamento.PROCESSANDO);
      expect(mockMercadoPagoService.criarPagamentoPix).not.toHaveBeenCalled();
      expect(mockPagamentoRepository.save).toHaveBeenCalled();
    });

    it('deve retornar pagamento já aprovado sem processar novamente', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.APROVADO,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);

      const result = await service.processarPagamento(1);

      expect(result.status).toBe(StatusPagamento.APROVADO);
      expect(mockMercadoPagoService.criarPagamentoPix).not.toHaveBeenCalled();
    });

    it('deve marcar como RECUSADO quando Mercado Pago falhar', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };

      mockPagamentoRepository.findOne
        .mockResolvedValueOnce(pagamentoMock)
        .mockResolvedValueOnce({
          ...pagamentoMock,
          status: StatusPagamento.PROCESSANDO,
        });

      mockMercadoPagoService.criarPagamentoPix.mockRejectedValue(
        new Error('Erro na API do Mercado Pago'),
      );

      mockPagamentoRepository.save
        .mockResolvedValueOnce({
          ...pagamentoMock,
          status: StatusPagamento.PROCESSANDO,
        })
        .mockResolvedValueOnce({
          ...pagamentoMock,
          status: StatusPagamento.RECUSADO,
        });

      await expect(service.processarPagamento(1)).rejects.toThrow('Erro na API do Mercado Pago');
      expect(mockPagamentoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: StatusPagamento.RECUSADO }),
      );
    });

    it('deve lançar erro quando pagamento não existe', async () => {
      // findOne é chamado no processarPagamento que chama findOne interno
      // findOne lança NotFoundException quando não encontra
      mockPagamentoRepository.findOne.mockImplementation(() => {
        throw new NotFoundException('Pagamento não encontrado');
      });

      await expect(service.processarPagamento(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('consultarStatusPagamento', () => {
    it('deve consultar status no Mercado Pago e atualizar', async () => {
      const pagamentoMock = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        transacaoId: '123456789',
        pedido: { id: 1 },
      };

      const mercadoPagoResponse = {
        id: '123456789',
        status: 'approved',
      };

      mockPagamentoRepository.findOne
        .mockResolvedValueOnce(pagamentoMock)
        .mockResolvedValueOnce({
          ...pagamentoMock,
          status: StatusPagamento.APROVADO,
          processedAt: new Date(),
        });

      mockMercadoPagoService.consultarPagamento.mockResolvedValue(
        mercadoPagoResponse,
      );
      mockPagamentoRepository.save.mockResolvedValue({
        ...pagamentoMock,
        status: StatusPagamento.APROVADO,
        processedAt: new Date(),
      });

      const result = await service.consultarStatusPagamento(1);

      expect(result.status).toBe(StatusPagamento.APROVADO);
      expect(mockMercadoPagoService.consultarPagamento).toHaveBeenCalledWith(
        '123456789',
      );
    });

    it('deve retornar pagamento sem transacaoId sem consultar', async () => {
      const pagamentoMock: any = {
        id: 1,
        valor: '100.00',
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusPagamento.PENDENTE,
        pedido: { id: 1 },
      };
      // Garantir que transacaoId não existe
      delete pagamentoMock.transacaoId;

      mockPagamentoRepository.findOne.mockResolvedValue(pagamentoMock);

      const result = await service.consultarStatusPagamento(1);

      expect(result.id).toBe(pagamentoMock.id);
      // Verifica se transacaoId não existe ou é falsy
      expect(!result.transacaoId).toBe(true);
      expect(mockMercadoPagoService.consultarPagamento).not.toHaveBeenCalled();
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

