import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Pagamentos (e2e) - Requisito Funcional 3: Processar Pagamento', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let pedidoId: number;
  let pagamentoId: number;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Criar pedido para usar nos testes
    const pedidoResponse = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        descricao: 'Pedido para pagamento',
        enderecoOrigem: 'Rua A, 123',
        enderecoDestino: 'Rua B, 456',
        valor: '200.00',
      });
    pedidoId = pedidoResponse.body.id;
  });

  afterAll(async () => {
    // Fechar conexão do TypeORM
    try {
      const connection = getConnection();
      if (connection && connection.isConnected) {
        await connection.close();
      }
    } catch (error) {
      // Ignorar erro se conexão já estiver fechada
    }
    // Fechar aplicação
    if (app) {
      await app.close();
    }
    // Fechar módulo
    if (moduleFixture) {
      await moduleFixture.close();
    }
    // Aguardar um pouco para garantir que todos os timers sejam limpos
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('POST /pagamentos - Criar Pagamento', () => {
    it('deve criar um pagamento com sucesso', () => {
      return request(app.getHttpServer())
        .post('/pagamentos')
        .send({
          valor: '200.00',
          metodoPagamento: 'pix',
          pedidoId: pedidoId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.valor).toBe('200.00');
          expect(res.body.metodoPagamento).toBe('pix');
          expect(res.body.status).toBe('pendente');
          expect(res.body.pedido).toBeDefined();
          pagamentoId = res.body.id;
        });
    });

    it('deve retornar erro 404 quando pedido não existe', () => {
      return request(app.getHttpServer())
        .post('/pagamentos')
        .send({
          valor: '100.00',
          metodoPagamento: 'cartao_credito',
          pedidoId: 99999,
        })
        .expect(404);
    });
  });

  describe('POST /pagamentos/:id/processar - Processar Pagamento', () => {
    it('deve processar um pagamento e mudar status para PROCESSANDO', () => {
      return request(app.getHttpServer())
        .post(`/pagamentos/${pagamentoId}/processar`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('processando');
          expect(res.body.id).toBe(pagamentoId);
        });
    });

    it('deve retornar erro 404 quando pagamento não existe', () => {
      return request(app.getHttpServer())
        .post('/pagamentos/99999/processar')
        .expect(404);
    });
  });

  describe('GET /pagamentos/:id - Buscar Pagamento', () => {
    it('deve retornar um pagamento específico', () => {
      return request(app.getHttpServer())
        .get(`/pagamentos/${pagamentoId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(pagamentoId);
          expect(res.body.pedido).toBeDefined();
        });
    });
  });
});

