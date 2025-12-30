import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RotasService } from './rotas.service';
import { Rota, StatusRota } from './rota.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { CreateRotaDto } from './dto/create-rota.dto';

describe('RotasService', () => {
  let service: RotasService;
  let rotaRepo: Repository<Rota>;
  let veiculoRepo: Repository<Veiculo>;

  const mockRotaRepository = {
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
        RotasService,
        {
          provide: getRepositoryToken(Rota),
          useValue: mockRotaRepository,
        },
        {
          provide: getRepositoryToken(Veiculo),
          useValue: mockVeiculoRepository,
        },
      ],
    }).compile();

    service = module.get<RotasService>(RotasService);
    rotaRepo = module.get<Repository<Rota>>(getRepositoryToken(Rota));
    veiculoRepo = module.get<Repository<Veiculo>>(getRepositoryToken(Veiculo));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma rota com sucesso', async () => {
      const veiculoMock = {
        id: 1,
        placa: 'ABC1234',
        modelo: 'Honda',
      };

      const rotaMock = {
        id: 1,
        nome: 'Rota Teste',
        descricao: 'Descrição da rota',
        status: StatusRota.PLANEJADA,
        distancia: '10.50',
        tempoEstimado: 30,
        veiculo: veiculoMock,
      };

      mockVeiculoRepository.findOne.mockResolvedValue(veiculoMock);
      mockRotaRepository.create.mockReturnValue(rotaMock);
      mockRotaRepository.save.mockResolvedValue(rotaMock);

      const dto: CreateRotaDto = {
        nome: 'Rota Teste',
        descricao: 'Descrição da rota',
        distancia: '10.50',
        tempoEstimado: 30,
        veiculoId: 1,
      };

      const result = await service.create(dto);

      expect(result).toEqual(rotaMock);
      expect(mockVeiculoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockRotaRepository.create).toHaveBeenCalled();
      expect(mockRotaRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro quando veículo não existe', async () => {
      mockVeiculoRepository.findOne.mockResolvedValue(null);

      const dto: CreateRotaDto = {
        nome: 'Rota Teste',
        descricao: 'Descrição',
        distancia: '10.50',
        tempoEstimado: 30,
        veiculoId: 999,
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Veículo não encontrado',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de rotas', async () => {
      const rotasMock = [
        {
          id: 1,
          nome: 'Rota 1',
          descricao: 'Descrição 1',
          status: StatusRota.PLANEJADA,
          veiculo: { id: 1 },
          pedidos: [],
        },
      ];

      mockRotaRepository.find.mockResolvedValue(rotasMock);

      const result = await service.findAll();

      expect(result).toEqual(rotasMock);
      expect(mockRotaRepository.find).toHaveBeenCalledWith({
        relations: ['veiculo', 'pedidos'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar uma rota existente', async () => {
      const rotaMock = {
        id: 1,
        nome: 'Rota Teste',
        descricao: 'Descrição',
        status: StatusRota.PLANEJADA,
        veiculo: { id: 1 },
        pedidos: [],
      };

      mockRotaRepository.findOne.mockResolvedValue(rotaMock);

      const result = await service.findOne(1);

      expect(result).toEqual(rotaMock);
      expect(mockRotaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['veiculo', 'pedidos'],
      });
    });

    it('deve lançar erro quando rota não existe', async () => {
      mockRotaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Rota não encontrada',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma rota com sucesso', async () => {
      const rotaMock = {
        id: 1,
        nome: 'Rota Antiga',
        descricao: 'Descrição',
        status: StatusRota.PLANEJADA,
        distancia: '10.50',
        tempoEstimado: 30,
      };

      mockRotaRepository.findOne.mockResolvedValue(rotaMock);
      mockRotaRepository.save.mockResolvedValue({
        ...rotaMock,
        nome: 'Rota Atualizada',
      });

      const result = await service.update(1, { nome: 'Rota Atualizada' });

      expect(result.nome).toBe('Rota Atualizada');
      expect(mockRotaRepository.save).toHaveBeenCalled();
    });

    it('deve atualizar status para EM_ANDAMENTO e definir startedAt', async () => {
      const rotaMock = {
        id: 1,
        nome: 'Rota',
        status: StatusRota.PLANEJADA,
        startedAt: null,
      };

      mockRotaRepository.findOne.mockResolvedValue(rotaMock);
      mockRotaRepository.save.mockResolvedValue({
        ...rotaMock,
        status: StatusRota.EM_ANDAMENTO,
        startedAt: new Date(),
      });

      const result = await service.update(1, {
        status: StatusRota.EM_ANDAMENTO,
      });

      expect(result.status).toBe(StatusRota.EM_ANDAMENTO);
    });

    it('deve atualizar status para CONCLUIDA e definir completedAt', async () => {
      const rotaMock = {
        id: 1,
        nome: 'Rota',
        status: StatusRota.EM_ANDAMENTO,
        completedAt: null,
      };

      mockRotaRepository.findOne.mockResolvedValue(rotaMock);
      mockRotaRepository.save.mockResolvedValue({
        ...rotaMock,
        status: StatusRota.CONCLUIDA,
        completedAt: new Date(),
      });

      const result = await service.update(1, {
        status: StatusRota.CONCLUIDA,
      });

      expect(result.status).toBe(StatusRota.CONCLUIDA);
    });

    it('deve atualizar veículo quando fornecido', async () => {
      const veiculoMock = { id: 2, placa: 'XYZ5678' };
      const rotaMock = {
        id: 1,
        nome: 'Rota',
        veiculo: { id: 1 },
      };

      mockRotaRepository.findOne.mockResolvedValue(rotaMock);
      mockVeiculoRepository.findOne.mockResolvedValue(veiculoMock);
      mockRotaRepository.save.mockResolvedValue({
        ...rotaMock,
        veiculo: veiculoMock,
      });

      const result = await service.update(1, { veiculoId: 2 });

      expect(result.veiculo).toEqual(veiculoMock);
      expect(mockVeiculoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
    });

    it('deve lançar erro quando veículo não existe no update', async () => {
      const rotaMock = {
        id: 1,
        nome: 'Rota',
        veiculo: { id: 1 },
      };

      mockRotaRepository.findOne.mockResolvedValue(rotaMock);
      mockVeiculoRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { veiculoId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover uma rota com sucesso', async () => {
      mockRotaRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockRotaRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar erro quando rota não existe', async () => {
      mockRotaRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});

