import { Test, TestingModule } from '@nestjs/testing';
import { EntregadoresController } from './entregadores.controller';
import { EntregadoresService } from './entregadores.service';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { StatusEntregador } from './entregador.entity';

describe('EntregadoresController', () => {
  let controller: EntregadoresController;
  let service: EntregadoresService;

  const mockEntregadoresService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    adicionarVeiculo: jest.fn(),
    removerVeiculo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntregadoresController],
      providers: [
        {
          provide: EntregadoresService,
          useValue: mockEntregadoresService,
        },
      ],
    }).compile();

    controller = module.get<EntregadoresController>(EntregadoresController);
    service = module.get<EntregadoresService>(EntregadoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um entregador', async () => {
      const dto: CreateEntregadorDto = {
        nome: 'João Silva',
        cpf: '12345678901',
        telefone: '11999999999',
        email: 'joao@test.com',
      };

      const expected = { id: 1, ...dto, status: StatusEntregador.DISPONIVEL };

      mockEntregadoresService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de entregadores', async () => {
      const expected = [{ id: 1, nome: 'João' }];

      mockEntregadoresService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um entregador', async () => {
      const expected = { id: 1, nome: 'João' };

      mockEntregadoresService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(result).toEqual(expected);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('deve atualizar um entregador', async () => {
      const dto: UpdateEntregadorDto = { nome: 'João Atualizado' };
      const expected = { id: 1, nome: 'João Atualizado' };

      mockEntregadoresService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('deve remover um entregador', async () => {
      mockEntregadoresService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Entregador removido com sucesso' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('adicionarVeiculo', () => {
    it('deve adicionar veículo ao entregador', async () => {
      const expected = { id: 1, nome: 'João', veiculos: [{ id: 1 }] };

      mockEntregadoresService.adicionarVeiculo.mockResolvedValue(expected);

      const result = await controller.adicionarVeiculo(1, 1);

      expect(result).toEqual(expected);
      expect(service.adicionarVeiculo).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('removerVeiculo', () => {
    it('deve remover veículo do entregador', async () => {
      const expected = { id: 1, nome: 'João', veiculos: [] };

      mockEntregadoresService.removerVeiculo.mockResolvedValue(expected);

      const result = await controller.removerVeiculo(1, 1);

      expect(result).toEqual(expected);
      expect(service.removerVeiculo).toHaveBeenCalledWith(1, 1);
    });
  });
});

