import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MercadoPagoService } from '../src/pagamentos/mercado-pago.service';

describe('Pagamentos PIX (e2e) - Integração Mercado Pago Mockada', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let pedidoId: number;
  let pagamentoId: number;
  let mercadoPagoService: MercadoPagoService;

  // Mock da resposta do Mercado Pago
  const mockMercadoPagoResponse = {
    id: '123456789',
    status: 'pending',
    point_of_interaction: {
      transaction_data: {
        qr_code:
          '00020126360014BR.GOV.BCB.PIX0114+5511999999999020400005303986540510.005802BR5925MERCADO PAGO SA6009SAO PAULO62070503***6304ABCD',
        qr_code_base64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        ticket_url:
          'https://www.mercadopago.com.br/payments/123456789/ticket',
      },
    },
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MercadoPagoService)
      .useValue({
        criarPagamentoPix: jest
          .fn()
          .mockResolvedValue(mockMercadoPagoResponse),
        consultarPagamento: jest.fn().mockResolvedValue({
          id: '123456789',
          status: 'approved',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await new Promise((resolve) => setTimeout(resolve, 500));

    mercadoPagoService = moduleFixture.get<MercadoPagoService>(
      MercadoPagoService,
    );

    // Criar pedido para usar nos testes
    const timestamp = Date.now();
    const pedidoResponse = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        descricao: `Pedido PIX Test ${timestamp}`,
        enderecoOrigem: 'Rua A, 123',
        enderecoDestino: 'Rua B, 456',
        valor: '150.00',
      });
    pedidoId = pedidoResponse.body.id;
  });

  afterAll(async () => {
    try {
      const connection = getConnection();
      if (connection && connection.isConnected) {
        await connection.close();
      }
    } catch (error) {
      // Ignorar erro se conexão já estiver fechada
    }
    if (app) {
      await app.close();
    }
    if (moduleFixture) {
      await moduleFixture.close();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('POST /pagamentos - Criar Pagamento PIX', () => {
    it('deve criar um pagamento PIX com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/pagamentos')
        .send({
          valor: '150.00',
          metodoPagamento: 'pix',
          pedidoId: pedidoId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.valor).toBe('150.00');
      expect(response.body.metodoPagamento).toBe('pix');
      expect(response.body.status).toBe('pendente');
      expect(response.body.pedido).toBeDefined();
      pagamentoId = response.body.id;
    });
  });

  describe('POST /pagamentos/:id/processar - Processar Pagamento PIX', () => {
    it('deve processar pagamento PIX e retornar QR Code', async () => {
      const response = await request(app.getHttpServer())
        .post(`/pagamentos/${pagamentoId}/processar`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pendente'); // PIX fica pendente até ser pago
      expect(response.body.transacaoId).toBe('123456789');
      expect(response.body.qrCode).toBeDefined();
      expect(response.body.qrCodeBase64).toBeDefined();
      expect(response.body.ticketUrl).toBeDefined();

      // Verifica se o QR Code tem formato válido (começa com 000201 para PIX)
      expect(response.body.qrCode).toContain('000201');
    });

    it('deve chamar o MercadoPagoService ao processar PIX', async () => {
      // Recriar pagamento para novo teste
      const novoPagamento = await request(app.getHttpServer())
        .post('/pagamentos')
        .send({
          valor: '200.00',
          metodoPagamento: 'pix',
          pedidoId: pedidoId,
        });

      await request(app.getHttpServer())
        .post(`/pagamentos/${novoPagamento.body.id}/processar`)
        .expect(201);

      // Verifica se o método foi chamado
      expect(mercadoPagoService.criarPagamentoPix).toHaveBeenCalled();
    });
  });

  describe('GET /pagamentos/:id/status - Consultar Status PIX', () => {
    it('deve consultar status do pagamento no Mercado Pago', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pagamentos/${pagamentoId}/status`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.transacaoId).toBe('123456789');
      // O status pode ser aprovado após consulta (mockado)
    });
  });

  describe('GET /pagamentos/:id - Buscar Pagamento com QR Code', () => {
    it('deve retornar pagamento PIX com dados do QR Code', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pagamentos/${pagamentoId}`)
        .expect(200);

      expect(response.body.id).toBe(pagamentoId);
      expect(response.body.metodoPagamento).toBe('pix');
      expect(response.body.qrCode).toBeDefined();
      expect(response.body.qrCodeBase64).toBeDefined();
      expect(response.body.ticketUrl).toBeDefined();
    });
  });
});

