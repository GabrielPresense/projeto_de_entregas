import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface MercadoPagoPixResponse {
  id: string;
  status: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly accessToken: string;

  constructor(private configService: ConfigService) {
    // Pega o token do .env ou usa um token de teste mockado
    this.accessToken =
      this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN') ||
      'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789';

    this.axiosInstance = axios.create({
      baseURL: 'https://api.mercadopago.com',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN')) {
      this.logger.warn(
        'MERCADO_PAGO_ACCESS_TOKEN não configurado. Usando token de teste mockado.',
      );
    }
  }

  /**
   * Cria um pagamento PIX via API do Mercado Pago
   * @param valor Valor do pagamento
   * @param descricao Descrição do pagamento
   * @param emailPagador Email do pagador (opcional)
   * @returns Dados do pagamento incluindo QR Code PIX
   */
  async criarPagamentoPix(
    valor: number,
    descricao: string,
    emailPagador?: string,
  ): Promise<MercadoPagoPixResponse> {
    try {
      const payload = {
        transaction_amount: valor,
        description: descricao,
        payment_method_id: 'pix',
        payer: {
          email: emailPagador || 'test@test.com',
        },
      };

      this.logger.log(
        `Criando pagamento PIX: R$ ${valor.toFixed(2)} - ${descricao}`,
      );

      const response = await this.axiosInstance.post<MercadoPagoPixResponse>(
        '/v1/payments',
        payload,
      );

      this.logger.log(`Pagamento PIX criado: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`,
      );
      throw new Error(
        `Falha ao criar pagamento PIX: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Consulta o status de um pagamento no Mercado Pago
   * @param paymentId ID do pagamento no Mercado Pago
   * @returns Dados atualizados do pagamento
   */
  async consultarPagamento(paymentId: string): Promise<any> {
    try {
      this.logger.log(`Consultando pagamento: ${paymentId}`);

      const response = await this.axiosInstance.get(`/v1/payments/${paymentId}`);

      this.logger.log(
        `Status do pagamento ${paymentId}: ${response.data.status}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erro ao consultar pagamento: ${error.response?.data?.message || error.message}`,
      );
      throw new Error(
        `Falha ao consultar pagamento: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

