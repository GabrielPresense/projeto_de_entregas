import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Localização (e2e) - Requisito Funcional 4: Atualizar Localização', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
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

    // Aguardar conexão do banco estar pronta
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Criar pedido para usar nos testes
    const pedidoResponse = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        descricao: 'Pedido para rastreamento',
        enderecoOrigem: 'Rua A, 123',
        enderecoDestino: 'Rua B, 456',
        valor: '150.00',
      });
    
    if (pedidoResponse.status !== 201) {
      throw new Error(`Falha ao criar pedido: ${pedidoResponse.status} - ${JSON.stringify(pedidoResponse.body)}`);
    }
    
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

  describe('PUT /pedidos/:id/location - Atualizar Localização', () => {
    it('deve atualizar a localização de um pedido com sucesso', () => {
      return request(app.getHttpServer())
        .put(`/pedidos/${pedidoId}/location`)
        .send({
          latitude: -23.5505,
          longitude: -46.6333,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(pedidoId);
          expect(res.body.latitudeAtual).toBe('-23.5505');
          expect(res.body.longitudeAtual).toBe('-46.6333');
        });
    });

    it('deve atualizar localização múltiplas vezes', async () => {
      // Primeira atualização
      await request(app.getHttpServer())
        .put(`/pedidos/${pedidoId}/location`)
        .send({
          latitude: -23.5515,
          longitude: -46.6343,
        })
        .expect(200);

      // Segunda atualização
      const response = await request(app.getHttpServer())
        .put(`/pedidos/${pedidoId}/location`)
        .send({
          latitude: -23.5525,
          longitude: -46.6353,
        })
        .expect(200);

      expect(response.body.latitudeAtual).toBe('-23.5525');
      expect(response.body.longitudeAtual).toBe('-46.6353');
    });

    it('deve retornar erro 400 com coordenadas inválidas', () => {
      return request(app.getHttpServer())
        .put(`/pedidos/${pedidoId}/location`)
        .send({
          latitude: 'abc',
          longitude: 'xyz',
        })
        .expect(400);
    });

    it('deve retornar erro 404 quando pedido não existe', () => {
      return request(app.getHttpServer())
        .put('/pedidos/99999/location')
        .send({
          latitude: -23.5505,
          longitude: -46.6333,
        })
        .expect(404);
    });
  });

  describe('GET /pedidos/:id - Verificar Localização Salva', () => {
    it('deve retornar pedido com localização atualizada', () => {
      return request(app.getHttpServer())
        .get(`/pedidos/${pedidoId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(pedidoId);
          expect(res.body.latitudeAtual).toBeDefined();
          expect(res.body.longitudeAtual).toBeDefined();
        });
    });
  });
});

