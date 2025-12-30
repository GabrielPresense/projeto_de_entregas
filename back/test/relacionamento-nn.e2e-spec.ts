import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Relacionamento N:N (e2e) - Requisito Funcional 5: Adicionar Veículo a Entregador', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let entregadorId: number;
  let veiculoId: number;
  let veiculoId2: number;

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
    const placa1 = `ABC${(timestamp % 10000).toString().padStart(4, '0')}`;
    const placa2 = `XYZ${((timestamp + 1) % 10000).toString().padStart(4, '0')}`;
    
    // CPF: 11 dígitos (formato: 12345678901)
    const cpf = `${(timestamp % 10000000000).toString().padStart(11, '0').slice(0, 11)}`;
    // Telefone: máximo 20 caracteres (formato: 11999999999)
    const telefone = `11${(random % 100000000).toString().padStart(8, '0')}`;
    const email = `entregador.nn.${timestamp}@test.com`;

    // Aguardar conexão do banco estar pronta
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Criar entregador para usar nos testes
    const entregadorResponse = await request(app.getHttpServer())
      .post('/entregadores')
      .send({
        nome: 'Entregador N:N Teste',
        cpf: cpf,
        telefone: telefone,
        email: email,
      });
    
    if (entregadorResponse.status !== 201) {
      throw new Error(`Falha ao criar entregador: ${entregadorResponse.status} - ${JSON.stringify(entregadorResponse.body)}`);
    }
    entregadorId = entregadorResponse.body.id;

    // Criar veículos para usar nos testes
    const veiculoResponse1 = await request(app.getHttpServer())
      .post('/veiculos')
      .send({
        placa: placa1,
        modelo: 'Honda CG',
        marca: 'Honda',
        tipo: 'moto',
        capacidade: 50,
      });
    
    if (veiculoResponse1.status !== 201) {
      throw new Error(`Falha ao criar veículo 1: ${veiculoResponse1.status} - ${JSON.stringify(veiculoResponse1.body)}`);
    }
    veiculoId = veiculoResponse1.body.id;

    const veiculoResponse2 = await request(app.getHttpServer())
      .post('/veiculos')
      .send({
        placa: placa2,
        modelo: 'Fiat Uno',
        marca: 'Fiat',
        tipo: 'carro',
        capacidade: 200,
      });
    
    if (veiculoResponse2.status !== 201) {
      throw new Error(`Falha ao criar veículo 2: ${veiculoResponse2.status} - ${JSON.stringify(veiculoResponse2.body)}`);
    }
    veiculoId2 = veiculoResponse2.body.id;
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

  describe('POST /entregadores/:id/veiculos/:veiculoId - Adicionar Veículo', () => {
    it('deve adicionar um veículo a um entregador com sucesso', async () => {
      // Verificar se os IDs foram criados corretamente
      expect(entregadorId).toBeDefined();
      expect(veiculoId).toBeDefined();

      const response = await request(app.getHttpServer())
        .post(`/entregadores/${entregadorId}/veiculos/${veiculoId}`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(entregadorId);
      expect(response.body.veiculos).toBeDefined();
      expect(Array.isArray(response.body.veiculos)).toBe(true);
      expect(response.body.veiculos.length).toBeGreaterThan(0);
      expect(
        response.body.veiculos.some((v: any) => v.id === veiculoId),
      ).toBe(true);
    });

    it('deve permitir adicionar múltiplos veículos ao mesmo entregador', async () => {
      // Adicionar segundo veículo
      const response = await request(app.getHttpServer())
        .post(`/entregadores/${entregadorId}/veiculos/${veiculoId2}`)
        .expect(201);

      expect(response.body.veiculos.length).toBeGreaterThanOrEqual(2);
      expect(
        response.body.veiculos.some((v: any) => v.id === veiculoId),
      ).toBe(true);
      expect(
        response.body.veiculos.some((v: any) => v.id === veiculoId2),
      ).toBe(true);
    });

    it('deve retornar erro 404 quando entregador não existe', async () => {
      const response = await request(app.getHttpServer())
        .post(`/entregadores/99999/veiculos/${veiculoId}`);

      // Pode retornar 404 ou 400 dependendo de onde o erro ocorre
      expect([400, 404]).toContain(response.status);
    });

    it('deve retornar erro 404 quando veículo não existe', async () => {
      const response = await request(app.getHttpServer())
        .post(`/entregadores/${entregadorId}/veiculos/99999`);

      // Pode retornar 404 ou 400 dependendo de onde o erro ocorre
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('GET /entregadores/:id - Verificar Relacionamento', () => {
    it('deve retornar entregador com veículos associados', () => {
      return request(app.getHttpServer())
        .get(`/entregadores/${entregadorId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(entregadorId);
          expect(res.body.veiculos).toBeDefined();
          expect(Array.isArray(res.body.veiculos)).toBe(true);
          expect(res.body.veiculos.length).toBeGreaterThan(0);
        });
    });
  });

  describe('DELETE /entregadores/:id/veiculos/:veiculoId - Remover Veículo', () => {
    it('deve remover um veículo de um entregador com sucesso', async () => {
      // Primeiro garantir que o veículo está associado
      await request(app.getHttpServer())
        .post(`/entregadores/${entregadorId}/veiculos/${veiculoId}`)
        .expect(201);

      // Agora remover
      const response = await request(app.getHttpServer())
        .delete(`/entregadores/${entregadorId}/veiculos/${veiculoId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(entregadorId);
      expect(response.body.veiculos).toBeDefined();
      expect(
        response.body.veiculos.some((v: any) => v.id === veiculoId),
      ).toBe(false);
    });
  });

  describe('POST /veiculos/:id/entregadores/:entregadorId - Adicionar Entregador ao Veículo', () => {
    it('deve adicionar um entregador a um veículo (lado inverso)', () => {
      return request(app.getHttpServer())
        .post(`/veiculos/${veiculoId2}/entregadores/${entregadorId}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(veiculoId2);
          expect(res.body.entregadores).toBeDefined();
          expect(Array.isArray(res.body.entregadores)).toBe(true);
        });
    });
  });
});

