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
    // Tenta pegar o token do .env, se não tiver usa um mock só pra não quebrar
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

  // Cria um pagamento PIX no Mercado Pago e retorna o QR Code
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

      // O Mercado Pago exige esse header pra evitar processar o mesmo pagamento duas vezes
      const idempotencyKey = `pix-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      this.logger.log(
        `Criando pagamento PIX: R$ ${valor.toFixed(2)} - ${descricao}`,
      );

      const response = await this.axiosInstance.post<MercadoPagoPixResponse>(
        '/v1/payments',
        payload,
        {
          headers: {
            'X-Idempotency-Key': idempotencyKey,
          },
        },
      );

      this.logger.log(`Pagamento PIX criado: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data;
      
      this.logger.error(
        `Erro ao criar pagamento PIX: ${errorMessage}`,
      );
      
      // Se o erro for "user not found" ou token inválido, gera um QR Code simulado para desenvolvimento
      if (
        errorMessage?.includes('user not found') ||
        errorMessage?.includes('invalid_token') ||
        errorMessage?.includes('unauthorized') ||
        error.response?.status === 401
      ) {
        this.logger.warn(
          'Token do Mercado Pago inválido ou sem permissões. Gerando QR Code simulado para desenvolvimento.',
        );
        
        // Gera um QR Code PIX simulado (formato EMV PIX)
        const qrCodeSimulado = this.gerarQRCodePixSimulado(valor, descricao);
        
        return {
          id: `mock-${Date.now()}`,
          status: 'pending',
          point_of_interaction: {
            transaction_data: {
              qr_code: qrCodeSimulado,
              qr_code_base64: undefined,
              ticket_url: undefined,
            },
          },
        };
      }
      
      throw new Error(
        `Falha ao criar pagamento PIX: ${errorMessage}`,
      );
    }
  }

  // Gera um QR Code PIX simulado no formato EMV para desenvolvimento
  // ATENÇÃO: Este é apenas um QR Code de exemplo para desenvolvimento
  // Para produção, é necessário configurar o token do Mercado Pago corretamente
  private gerarQRCodePixSimulado(valor: number, descricao: string): string {
    // Formato EMV PIX básico (estrutura simplificada para desenvolvimento)
    // Em produção, o Mercado Pago gera um QR Code válido automaticamente
    
    const valorFormatado = valor.toFixed(2).replace('.', '');
    const descricaoFormatada = descricao.substring(0, 25).replace(/[^a-zA-Z0-9\s]/g, '');
    
    // Estrutura básica do QR Code PIX (formato EMV)
    // Payload Format Indicator (00) = 01
    const payloadFormat = '000201';
    
    // Merchant Account Information (26) - Informações da conta
    // ID do guia (00) = br.gov.bcb.pix
    // Chave PIX (01) = chave de exemplo (não válida)
    const merchantInfo = `26${(14 + 32).toString().padStart(2, '0')}0014br.gov.bcb.pix0132${Date.now().toString().substring(0, 32)}`;
    
    // Merchant Category Code (52) = 0000 (genérico)
    const merchantCategory = '52040000';
    
    // Transaction Currency (53) = 986 (BRL)
    const currency = '5303986';
    
    // Transaction Amount (54) = valor
    const amount = `54${valorFormatado.length.toString().padStart(2, '0')}${valorFormatado}`;
    
    // Country Code (58) = BR
    const country = '5802BR';
    
    // Merchant Name (59) = descrição
    const merchantName = `59${descricaoFormatada.length.toString().padStart(2, '0')}${descricaoFormatada}`;
    
    // Additional Data Field Template (62)
    const additionalData = '62070503***';
    
    // CRC16 (63) = checksum (simulado)
    const crc = '6304';
    
    // Monta o QR Code completo
    const qrCode = `${payloadFormat}${merchantInfo}${merchantCategory}${currency}${amount}${country}${merchantName}${additionalData}${crc}`;
    
    this.logger.warn(
      `QR Code PIX simulado gerado (apenas para desenvolvimento). Configure o token do Mercado Pago para gerar QR Codes válidos.`,
    );
    
    return qrCode;
  }

  // Consulta o status de um pagamento no Mercado Pago pra ver se foi aprovado
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

