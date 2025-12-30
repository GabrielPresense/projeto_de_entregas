import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService, MercadoPagoPixResponse } from './mercado-pago.service';
import axios from 'axios';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criarPagamentoPix', () => {
    it('deve criar pagamento PIX com sucesso', async () => {
      const mockResponse: MercadoPagoPixResponse = {
        id: '123456789',
        status: 'pending',
        point_of_interaction: {
          transaction_data: {
            qr_code: '00020126360014BR.GOV.BCB.PIX0114+5511999999999...',
            qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAA...',
            ticket_url: 'https://www.mercadopago.com.br/payments/123456789/ticket',
          },
        },
      };

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      // Recria o service para usar o mock
      const newService = new MercadoPagoService(mockConfigService as any);

      const result = await newService.criarPagamentoPix(100.0, 'Teste PIX');

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/payments', {
        transaction_amount: 100.0,
        description: 'Teste PIX',
        payment_method_id: 'pix',
        payer: {
          email: 'test@test.com',
        },
      });
    });

    it('deve usar email do pagador quando fornecido', async () => {
      const mockResponse: MercadoPagoPixResponse = {
        id: '123456789',
        status: 'pending',
      };

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const newService = new MercadoPagoService(mockConfigService as any);

      await newService.criarPagamentoPix(100.0, 'Teste', 'cliente@email.com');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/payments',
        expect.objectContaining({
          payer: {
            email: 'cliente@email.com',
          },
        }),
      );
    });

    it('deve lançar erro quando API falhar', async () => {
      const mockAxiosInstance = {
        post: jest.fn().mockRejectedValue({
          response: {
            data: {
              message: 'Invalid access token',
            },
          },
        }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const newService = new MercadoPagoService(mockConfigService as any);

      await expect(
        newService.criarPagamentoPix(100.0, 'Teste'),
      ).rejects.toThrow('Falha ao criar pagamento PIX: Invalid access token');
    });
  });

  describe('consultarPagamento', () => {
    it('deve consultar pagamento com sucesso', async () => {
      const mockResponse = {
        id: '123456789',
        status: 'approved',
      };

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: mockResponse }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const newService = new MercadoPagoService(mockConfigService as any);

      const result = await newService.consultarPagamento('123456789');

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/payments/123456789');
    });

    it('deve lançar erro quando consulta falhar', async () => {
      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue({
          response: {
            data: {
              message: 'Payment not found',
            },
          },
        }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const newService = new MercadoPagoService(mockConfigService as any);

      await expect(newService.consultarPagamento('999')).rejects.toThrow(
        'Falha ao consultar pagamento: Payment not found',
      );
    });
  });

  describe('constructor', () => {
    it('deve usar token do .env quando disponível', () => {
      mockConfigService.get.mockReturnValue('TEST-TOKEN-REAL');

      const newService = new MercadoPagoService(mockConfigService as any);

      expect(mockConfigService.get).toHaveBeenCalledWith('MERCADO_PAGO_ACCESS_TOKEN');
    });

    it('deve usar token mockado quando .env não tiver token', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const newService = new MercadoPagoService(mockConfigService as any);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer TEST-'),
          }),
        }),
      );
    });
  });
});

