import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Pedidos (e2e) - Requisito Funcional 2: Criar Pedido', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let entregadorId: number;
  let pedidoId: number;

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

    // Gerar dados únicos para evitar duplicação
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    // CPF: 11 dígitos (formato: 12345678901)
    const cpf = `${(timestamp % 10000000000).toString().padStart(11, '0').slice(0, 11)}`;
    const telefone = `11${(random % 100000000).toString().padStart(8, '0')}`;
    const email = `entregador.${timestamp}@test.com`;

    // Criar entregador para usar nos testes
    const entregadorResponse = await request(app.getHttpServer())
      .post('/entregadores')
      .send({
        nome: 'Entregador Teste',
        cpf: cpf,
        telefone: telefone,
        email: email,
      });
    entregadorId = entregadorResponse.body.id;
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

  describe('POST /pedidos - Criar Pedido', () => {
    it('deve criar um pedido com sucesso', () => {
      return request(app.getHttpServer())
        .post('/pedidos')
        .send({
          descricao: 'Entrega de produtos eletrônicos',
          enderecoOrigem: 'Rua A, 123, São Paulo - SP',
          enderecoDestino: 'Rua B, 456, São Paulo - SP',
          valor: '150.00',
          entregadorId: entregadorId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.descricao).toBe('Entrega de produtos eletrônicos');
          expect(res.body.enderecoOrigem).toBe('Rua A, 123, São Paulo - SP');
          expect(res.body.enderecoDestino).toBe('Rua B, 456, São Paulo - SP');
          expect(res.body.valor).toBe('150.00');
          expect(res.body.status).toBe('pendente');
          expect(res.body.entregador).toBeDefined();
          expect(res.body.entregador.id).toBe(entregadorId);
          pedidoId = res.body.id;
        });
    });

    it('deve criar pedido sem entregador', () => {
      return request(app.getHttpServer())
        .post('/pedidos')
        .send({
          descricao: 'Pedido sem entregador',
          enderecoOrigem: 'Rua C, 789',
          enderecoDestino: 'Rua D, 012',
          valor: '100.00',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          // TypeORM retorna undefined quando a relação não existe, não null
          expect(res.body.entregador).toBeFalsy();
        });
    });

    it('deve retornar erro 400 com dados inválidos', () => {
      return request(app.getHttpServer())
        .post('/pedidos')
        .send({
          descricao: '',
          valor: 'abc',
        })
        .expect(400);
    });

    it('deve retornar erro 404 quando entregador não existe', () => {
      return request(app.getHttpServer())
        .post('/pedidos')
        .send({
          descricao: 'Pedido teste',
          enderecoOrigem: 'Rua A',
          enderecoDestino: 'Rua B',
          valor: '50.00',
          entregadorId: 99999,
        })
        .expect(404);
    });
  });

  describe('GET /pedidos/:id - Buscar Pedido', () => {
    it('deve retornar um pedido específico', () => {
      return request(app.getHttpServer())
        .get(`/pedidos/${pedidoId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(pedidoId);
          expect(res.body.entregador).toBeDefined();
        });
    });
  });
});

