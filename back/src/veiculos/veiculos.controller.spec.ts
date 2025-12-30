import { Test, TestingModule } from '@nestjs/testing';
import { VeiculosController } from './veiculos.controller';
import { VeiculosService } from './veiculos.service';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';
import { TipoVeiculo } from './veiculo.entity';

describe('VeiculosController', () => {
  let controller: VeiculosController;
  let service: VeiculosService;

  const mockVeiculosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findDisponiveis: jest.fn(),
    adicionarEntregador: jest.fn(),
    removerEntregador: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VeiculosController],
      providers: [
        {
          provide: VeiculosService,
          useValue: mockVeiculosService,
        },
      ],
    }).compile();

    controller = module.get<VeiculosController>(VeiculosController);
    service = module.get<VeiculosService>(VeiculosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um veículo', async () => {
      const dto: CreateVeiculoDto = {
        placa: 'ABC1234',
        modelo: 'Honda CG',
        marca: 'Honda',
        tipo: TipoVeiculo.MOTO,
        capacidade: 50,
      };

      const expected = { id: 1, ...dto, disponivel: true };

      mockVeiculosService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de veículos', async () => {
      const expected = [{ id: 1, placa: 'ABC1234' }];

      mockVeiculosService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findDisponiveis', () => {
    it('deve retornar veículos disponíveis', async () => {
      const expected = [{ id: 1, placa: 'ABC1234', disponivel: true }];

      mockVeiculosService.findDisponiveis.mockResolvedValue(expected);

      const result = await controller.findDisponiveis();

      expect(result).toEqual(expected);
      expect(service.findDisponiveis).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um veículo', async () => {
      const expected = { id: 1, placa: 'ABC1234' };

      mockVeiculosService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(result).toEqual(expected);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('deve atualizar um veículo', async () => {
      const dto: UpdateVeiculoDto = { modelo: 'Honda CG 160' };
      const expected = { id: 1, modelo: 'Honda CG 160' };

      mockVeiculosService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('deve remover um veículo', async () => {
      mockVeiculosService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Veículo removido com sucesso' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('adicionarEntregador', () => {
    it('deve adicionar entregador ao veículo', async () => {
      const expected = { id: 1, entregadores: [{ id: 1 }] };

      mockVeiculosService.adicionarEntregador.mockResolvedValue(expected);

      const result = await controller.adicionarEntregador(1, 1);

      expect(result).toEqual(expected);
      expect(service.adicionarEntregador).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('removerEntregador', () => {
    it('deve remover entregador do veículo', async () => {
      const expected = { id: 1, entregadores: [] };

      mockVeiculosService.removerEntregador.mockResolvedValue(expected);

      const result = await controller.removerEntregador(1, 1);

      expect(result).toEqual(expected);
      expect(service.removerEntregador).toHaveBeenCalledWith(1, 1);
    });
  });
});

