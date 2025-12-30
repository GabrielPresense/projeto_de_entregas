import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { VeiculosService } from './veiculos.service';
import { Veiculo, TipoVeiculo } from './veiculo.entity';
import { Entregador } from '../entregadores/entregador.entity';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';

describe('VeiculosService', () => {
  let service: VeiculosService;
  let veiculoRepo: Repository<Veiculo>;
  let entregadorRepo: Repository<Entregador>;

  const mockVeiculoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockEntregadorRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VeiculosService,
        {
          provide: getRepositoryToken(Veiculo),
          useValue: mockVeiculoRepository,
        },
        {
          provide: getRepositoryToken(Entregador),
          useValue: mockEntregadorRepository,
        },
      ],
    }).compile();

    service = module.get<VeiculosService>(VeiculosService);
    veiculoRepo = module.get<Repository<Veiculo>>(getRepositoryToken(Veiculo));
    entregadorRepo = module.get<Repository<Entregador>>(
      getRepositoryToken(Entregador),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um veículo com sucesso', async () => {
      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        modelo: 'Honda CG',
        marca: 'Honda',
        tipo: TipoVeiculo.MOTO,
        capacidade: 50,
        disponivel: true,
      };

      mockVeiculoRepository.create.mockReturnValue(veiculoMock);
      mockVeiculoRepository.save.mockResolvedValue(veiculoMock);

      const dto: CreateVeiculoDto = {
        placa: 'ABC1234',
        modelo: 'Honda CG',
        marca: 'Honda',
        tipo: TipoVeiculo.MOTO,
        capacidade: 50,
      };

      const result = await service.create(dto);

      expect(result).toEqual(veiculoMock);
      expect(mockVeiculoRepository.create).toHaveBeenCalledWith({
        placa: dto.placa,
        modelo: dto.modelo,
        marca: dto.marca,
        tipo: dto.tipo,
        capacidade: dto.capacidade,
        disponivel: true,
      });
      expect(mockVeiculoRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de veículos', async () => {
      const veiculosMock = [
        {
          id: 1,
          placa: 'ABC1234',
          modelo: 'Honda',
          rotas: [],
          entregadores: [],
        },
      ];

      mockVeiculoRepository.find.mockResolvedValue(veiculosMock);

      const result = await service.findAll();

      expect(result).toEqual(veiculosMock);
      expect(mockVeiculoRepository.find).toHaveBeenCalledWith({
        relations: ['rotas', 'entregadores'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um veículo existente', async () => {
      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        modelo: 'Honda',
        rotas: [],
        entregadores: [],
      };

      mockVeiculoRepository.findOne.mockResolvedValue(veiculoMock);

      const result = await service.findOne(1);

      expect(result).toEqual(veiculoMock);
      expect(mockVeiculoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['rotas', 'entregadores'],
      });
    });

    it('deve lançar erro quando veículo não existe', async () => {
      mockVeiculoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Veículo não encontrado',
      );
    });
  });

  describe('findDisponiveis', () => {
    it('deve retornar apenas veículos disponíveis', async () => {
      const veiculosMock = [
        {
          id: 1,
          placa: 'ABC1234',
          disponivel: true,
          entregadores: [],
        },
      ];

      mockVeiculoRepository.find.mockResolvedValue(veiculosMock);

      const result = await service.findDisponiveis();

      expect(result).toEqual(veiculosMock);
      expect(mockVeiculoRepository.find).toHaveBeenCalledWith({
        where: { disponivel: true },
        relations: ['entregadores'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('adicionarEntregador', () => {
    it('deve adicionar entregador ao veículo', async () => {
      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        entregadores: [],
        rotas: [],
      };

      const entregadorMock = {
        id: 1,
        nome: 'João',
      };

      mockVeiculoRepository.findOne
        .mockResolvedValueOnce(veiculoMock)
        .mockResolvedValueOnce({ ...veiculoMock, entregadores: [entregadorMock] });

      mockEntregadorRepository.findOne.mockResolvedValue(entregadorMock);
      mockVeiculoRepository.save.mockResolvedValue({
        ...veiculoMock,
        entregadores: [entregadorMock],
      });

      const result = await service.adicionarEntregador(1, 1);

      expect(result.entregadores).toContainEqual(entregadorMock);
      expect(mockVeiculoRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro quando entregador não existe', async () => {
      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        entregadores: [],
        rotas: [],
      };

      mockVeiculoRepository.findOne.mockResolvedValue(veiculoMock);
      mockEntregadorRepository.findOne.mockResolvedValue(null);

      await expect(service.adicionarEntregador(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removerEntregador', () => {
    it('deve remover entregador do veículo', async () => {
      const entregador1 = { id: 1, nome: 'João' };
      const entregador2 = { id: 2, nome: 'Maria' };
      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        entregadores: [entregador1, entregador2],
        rotas: [],
      };

      mockVeiculoRepository.findOne
        .mockResolvedValueOnce(veiculoMock)
        .mockResolvedValueOnce({ ...veiculoMock, entregadores: [entregador2] });

      mockVeiculoRepository.save.mockResolvedValue({
        ...veiculoMock,
        entregadores: [entregador2],
      });

      const result = await service.removerEntregador(1, 1);

      expect(result.entregadores).not.toContainEqual(entregador1);
      expect(result.entregadores).toContainEqual(entregador2);
    });
  });

  describe('update', () => {
    it('deve atualizar um veículo com sucesso', async () => {
      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        modelo: 'Honda',
        disponivel: true,
      };

      mockVeiculoRepository.findOne.mockResolvedValue(veiculoMock);
      mockVeiculoRepository.save.mockResolvedValue({
        ...veiculoMock,
        modelo: 'Honda CG',
      });

      const result = await service.update(1, { modelo: 'Honda CG' });

      expect(result.modelo).toBe('Honda CG');
      expect(mockVeiculoRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover um veículo com sucesso', async () => {
      mockVeiculoRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockVeiculoRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar erro quando veículo não existe', async () => {
      mockVeiculoRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});

