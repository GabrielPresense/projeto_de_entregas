import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Entregadores (e2e) - Requisito Funcional 1: Criar Entregador', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

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

  let entregadorId: number;

  describe('POST /entregadores - Criar Entregador', () => {
    it('deve criar um entregador com sucesso', async () => {
      // Gerar dados únicos para evitar duplicação
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      // CPF: 11 dígitos (formato: 12345678901)
      const cpf = `${(timestamp % 10000000000).toString().padStart(11, '0').slice(0, 11)}`;
      const telefone = `11${(random % 100000000).toString().padStart(8, '0')}`;
      const email = `joao.${timestamp}@test.com`;

      const response = await request(app.getHttpServer())
        .post('/entregadores')
        .send({
          nome: 'João Silva',
          cpf: cpf,
          telefone: telefone,
          email: email,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('João Silva');
      expect(response.body.cpf).toBe(cpf);
      expect(response.body.telefone).toBe(telefone);
      expect(response.body.email).toBe(email);
      expect(response.body.status).toBe('disponivel');
      entregadorId = response.body.id;
    });

    it('deve retornar erro 400 com dados inválidos (email inválido)', async () => {
      // Gerar CPF único para este teste
      const timestamp = Date.now();
      const cpf = `${(timestamp % 10000000000).toString().padStart(11, '0').slice(0, 11)}`;
      
      await request(app.getHttpServer())
        .post('/entregadores')
        .send({
          nome: 'Maria',
          cpf: cpf,
          telefone: '11999999999',
          email: 'email-invalido',
        })
        .expect(400);
    });

    it('deve retornar erro 400 com campos obrigatórios faltando', () => {
      return request(app.getHttpServer())
        .post('/entregadores')
        .send({
          nome: 'Maria',
        })
        .expect(400);
    });
  });

  describe('GET /entregadores/:id - Buscar Entregador', () => {
    it('deve retornar um entregador específico', () => {
      return request(app.getHttpServer())
        .get(`/entregadores/${entregadorId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(entregadorId);
          expect(res.body.nome).toBe('João Silva');
        });
    });

    it('deve retornar 404 para entregador inexistente', () => {
      return request(app.getHttpServer())
        .get('/entregadores/99999')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('Entregador não encontrado');
        });
    });
  });

  describe('GET /entregadores - Listar Entregadores', () => {
    it('deve retornar lista de entregadores', () => {
      return request(app.getHttpServer())
        .get('/entregadores')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });
});

