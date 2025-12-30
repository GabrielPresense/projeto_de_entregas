import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { EntregadoresService } from './entregadores.service';
import { Entregador, StatusEntregador } from './entregador.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { CreateEntregadorDto } from './dto/create-entregador.dto';

describe('EntregadoresService', () => {
  let service: EntregadoresService;
  let entregadorRepo: Repository<Entregador>;
  let veiculoRepo: Repository<Veiculo>;

  const mockEntregadorRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockVeiculoRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntregadoresService,
        {
          provide: getRepositoryToken(Entregador),
          useValue: mockEntregadorRepository,
        },
        {
          provide: getRepositoryToken(Veiculo),
          useValue: mockVeiculoRepository,
        },
      ],
    }).compile();

    service = module.get<EntregadoresService>(EntregadoresService);
    entregadorRepo = module.get<Repository<Entregador>>(
      getRepositoryToken(Entregador),
    );
    veiculoRepo = module.get<Repository<Veiculo>>(getRepositoryToken(Veiculo));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um entregador com sucesso', async () => {
      const dto: CreateEntregadorDto = {
        nome: 'João Silva',
        cpf: '12345678901',
        telefone: '11999999999',
        email: 'joao@test.com',
      };

      const entregadorMock = {
        id: 1,
        ...dto,
        status: StatusEntregador.DISPONIVEL,
        pedidos: [],
        veiculos: [],
      };

      mockEntregadorRepository.create.mockReturnValue(entregadorMock);
      mockEntregadorRepository.save.mockResolvedValue(entregadorMock);

      const result = await service.create(dto);

      expect(result).toEqual(entregadorMock);
      expect(mockEntregadorRepository.create).toHaveBeenCalledWith({
        nome: dto.nome,
        cpf: dto.cpf,
        telefone: dto.telefone,
        email: dto.email,
        status: undefined,
      });
      expect(mockEntregadorRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de entregadores', async () => {
      const entregadoresMock = [
        {
          id: 1,
          nome: 'João Silva',
          cpf: '12345678901',
          telefone: '11999999999',
          email: 'joao@test.com',
          status: StatusEntregador.DISPONIVEL,
          pedidos: [],
          veiculos: [],
        },
      ];

      mockEntregadorRepository.find.mockResolvedValue(entregadoresMock);

      const result = await service.findAll();

      expect(result).toEqual(entregadoresMock);
      expect(mockEntregadorRepository.find).toHaveBeenCalledWith({
        relations: ['pedidos', 'veiculos'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um entregador existente', async () => {
      const entregadorMock = {
        id: 1,
        nome: 'João Silva',
        cpf: '12345678901',
        telefone: '11999999999',
        email: 'joao@test.com',
        status: StatusEntregador.DISPONIVEL,
        pedidos: [],
        veiculos: [],
      };

      mockEntregadorRepository.findOne.mockResolvedValue(entregadorMock);

      const result = await service.findOne(1);

      expect(result).toEqual(entregadorMock);
      expect(mockEntregadorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['pedidos', 'veiculos'],
      });
    });

    it('deve lançar NotFoundException quando entregador não existe', async () => {
      mockEntregadorRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Entregador não encontrado',
      );
    });
  });

  describe('adicionarVeiculo', () => {
    it('deve adicionar veículo ao entregador', async () => {
      const entregadorMock = {
        id: 1,
        nome: 'João Silva',
        veiculos: [],
        pedidos: [],
      };

      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        modelo: 'Honda',
      };

      mockEntregadorRepository.findOne
        .mockResolvedValueOnce(entregadorMock) // Primeira chamada (findOne)
        .mockResolvedValueOnce({ ...entregadorMock, veiculos: [veiculoMock] }); // Segunda chamada (retorno final)

      mockVeiculoRepository.findOne.mockResolvedValue(veiculoMock);
      mockEntregadorRepository.save.mockResolvedValue({
        ...entregadorMock,
        veiculos: [veiculoMock],
      });

      const result = await service.adicionarVeiculo(1, 1);

      expect(result.veiculos).toContainEqual(veiculoMock);
      expect(mockEntregadorRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro quando veículo não existe', async () => {
      const entregadorMock = {
        id: 1,
        nome: 'João Silva',
        veiculos: [],
        pedidos: [],
      };

      mockEntregadorRepository.findOne.mockResolvedValue(entregadorMock);
      mockVeiculoRepository.findOne.mockResolvedValue(null);

      await expect(service.adicionarVeiculo(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removerVeiculo', () => {
    it('deve remover veículo do entregador', async () => {
      const veiculo1 = { id: 1, placa: 'ABC1234' };
      const veiculo2 = { id: 2, placa: 'XYZ5678' };
      const entregadorMock = {
        id: 1,
        nome: 'João Silva',
        veiculos: [veiculo1, veiculo2],
        pedidos: [],
      };

      mockEntregadorRepository.findOne
        .mockResolvedValueOnce(entregadorMock)
        .mockResolvedValueOnce({ ...entregadorMock, veiculos: [veiculo2] });

      mockEntregadorRepository.save.mockResolvedValue({
        ...entregadorMock,
        veiculos: [veiculo2],
      });

      const result = await service.removerVeiculo(1, 1);

      expect(result.veiculos).not.toContainEqual(veiculo1);
      expect(result.veiculos).toContainEqual(veiculo2);
    });
  });

  describe('update', () => {
    it('deve atualizar um entregador com sucesso', async () => {
      const entregadorMock = {
        id: 1,
        nome: 'João Silva',
        cpf: '12345678901',
        telefone: '11999999999',
        email: 'joao@test.com',
        status: StatusEntregador.DISPONIVEL,
      };

      mockEntregadorRepository.findOne.mockResolvedValue(entregadorMock);
      mockEntregadorRepository.save.mockResolvedValue({
        ...entregadorMock,
        nome: 'João Atualizado',
      });

      const result = await service.update(1, { nome: 'João Atualizado' });

      expect(result.nome).toBe('João Atualizado');
      expect(mockEntregadorRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover um entregador com sucesso', async () => {
      mockEntregadorRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockEntregadorRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar erro quando entregador não existe', async () => {
      mockEntregadorRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});

