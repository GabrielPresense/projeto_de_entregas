import { Test, TestingModule } from '@nestjs/testing';
import { RotasController } from './rotas.controller';
import { RotasService } from './rotas.service';
import { CreateRotaDto } from './dto/create-rota.dto';
import { UpdateRotaDto } from './dto/update-rota.dto';

describe('RotasController', () => {
  let controller: RotasController;
  let service: RotasService;

  const mockRotasService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RotasController],
      providers: [
        {
          provide: RotasService,
          useValue: mockRotasService,
        },
      ],
    }).compile();

    controller = module.get<RotasController>(RotasController);
    service = module.get<RotasService>(RotasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma rota', async () => {
      const dto: CreateRotaDto = {
        nome: 'Rota Teste',
        descricao: 'Descrição',
        distancia: '10.50',
        tempoEstimado: 30,
        veiculoId: 1,
      };

      const expected = { id: 1, ...dto };

      mockRotasService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de rotas', async () => {
      const expected = [{ id: 1, nome: 'Rota' }];

      mockRotasService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar uma rota', async () => {
      const expected = { id: 1, nome: 'Rota' };

      mockRotasService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(result).toEqual(expected);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('deve atualizar uma rota', async () => {
      const dto: UpdateRotaDto = { nome: 'Rota Atualizada' };
      const expected = { id: 1, nome: 'Rota Atualizada' };

      mockRotasService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('deve remover uma rota', async () => {
      mockRotasService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Rota removida com sucesso' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});

