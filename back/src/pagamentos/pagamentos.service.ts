import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pagamento, StatusPagamento, MetodoPagamento } from './pagamento.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { UpdatePagamentoDto } from './dto/update-pagamento.dto';
import { MercadoPagoService } from './mercado-pago.service';

@Injectable()
export class PagamentosService {
  constructor(
    @InjectRepository(Pagamento)
    private readonly pagamentoRepo: Repository<Pagamento>,
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async create(data: CreatePagamentoDto): Promise<Pagamento> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id: data.pedidoId },
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    const pagamento = this.pagamentoRepo.create({
      valor: data.valor,
      metodoPagamento: data.metodoPagamento,
      status: data.status ?? StatusPagamento.PENDENTE,
      transacaoId: data.transacaoId,
      pedido,
    });

    return await this.pagamentoRepo.save(pagamento);
  }

  async findAll(): Promise<Pagamento[]> {
    return this.pagamentoRepo.find({
      relations: ['pedido'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepo.findOne({
      where: { id },
      relations: ['pedido'],
    });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');
    if (!pagamento.pedido) {
      throw new NotFoundException('Pedido associado ao pagamento não encontrado');
    }
    return pagamento;
  }

  async update(id: number, data: UpdatePagamentoDto): Promise<Pagamento> {
    const pagamento = await this.findOne(id);

    if (data.valor !== undefined) pagamento.valor = data.valor;
    if (data.metodoPagamento !== undefined)
      pagamento.metodoPagamento = data.metodoPagamento;
    if (data.status !== undefined) {
      pagamento.status = data.status;
      if (data.status === StatusPagamento.APROVADO && !pagamento.processedAt) {
        pagamento.processedAt = new Date();
      }
    }
    if (data.transacaoId !== undefined)
      pagamento.transacaoId = data.transacaoId;

    return await this.pagamentoRepo.save(pagamento);
  }

  async remove(id: number): Promise<void> {
    const result = await this.pagamentoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Pagamento não encontrado');
    }
  }

  async processarPagamento(id: number, emailPagador?: string): Promise<Pagamento> {
    const pagamento = await this.findOne(id);

    if (pagamento.status === StatusPagamento.APROVADO) {
      return pagamento;
    }

    pagamento.status = StatusPagamento.PROCESSANDO;
    await this.pagamentoRepo.save(pagamento);

    try {
      // Se for PIX, chama o Mercado Pago pra gerar o QR Code
      if (pagamento.metodoPagamento === MetodoPagamento.PIX) {
        const valor = parseFloat(pagamento.valor);
        const descricao = `Pagamento pedido #${pagamento.pedido.id}`;

        const response = await this.mercadoPagoService.criarPagamentoPix(
          valor,
          descricao,
          emailPagador,
        );

        // Salva tudo que o Mercado Pago retornou (QR Code, URL, etc)
        pagamento.transacaoId = response.id;
        pagamento.qrCode = response.point_of_interaction?.transaction_data?.qr_code;
        pagamento.qrCodeBase64 =
          response.point_of_interaction?.transaction_data?.qr_code_base64;
        pagamento.ticketUrl =
          response.point_of_interaction?.transaction_data?.ticket_url;
        // PIX fica pendente até o cliente pagar, então não aprova automaticamente
        pagamento.status = StatusPagamento.PENDENTE;

        await this.pagamentoRepo.save(pagamento);

        return pagamento;
      } else if (pagamento.metodoPagamento === MetodoPagamento.DINHEIRO) {
        // Para pagamento em dinheiro, mantém como pendente até o entregador confirmar o recebimento
        // O admin/entregador pode aprovar manualmente quando receber o pagamento
        pagamento.status = StatusPagamento.PENDENTE;
        await this.pagamentoRepo.save(pagamento);
        return pagamento;
      } else {
        // Pra outros métodos (cartão, boleto) simula um processamento assíncrono
        const timer = setTimeout(async () => {
          pagamento.status = StatusPagamento.APROVADO;
          pagamento.processedAt = new Date();
          await this.pagamentoRepo.save(pagamento);
        }, 2000);

        // Isso aqui deixa o timer rodar sem travar o processo
        timer.unref();
        return pagamento;
      }
    } catch (error: any) {
      // Se deu erro, marca como recusado e joga o erro pra frente
      pagamento.status = StatusPagamento.RECUSADO;
      await this.pagamentoRepo.save(pagamento);
      
      // Loga tudo pra eu ver depois o que aconteceu
      console.error('Erro ao processar pagamento:', error);
      console.error('Stack:', error.stack);
      
      // Tenta pegar uma mensagem de erro útil, senão usa uma genérica
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido ao processar pagamento';
      throw new Error(`Falha ao processar pagamento PIX: ${errorMessage}`);
    }
  }

  // Consulta o status no Mercado Pago e atualiza aqui no banco
  // Útil pra verificar se um PIX que estava pendente já foi pago
  async consultarStatusPagamento(id: number): Promise<Pagamento> {
    const pagamento = await this.findOne(id);

    // Se não tem transacaoId, não tem como consultar no Mercado Pago
    if (!pagamento.transacaoId) {
      return pagamento;
    }

    try {
      const statusMercadoPago =
        await this.mercadoPagoService.consultarPagamento(
          pagamento.transacaoId,
        );

      // Atualiza o status aqui no banco baseado no que o Mercado Pago retornou
      if (statusMercadoPago.status === 'approved') {
        pagamento.status = StatusPagamento.APROVADO;
        pagamento.processedAt = new Date();
      } else if (statusMercadoPago.status === 'rejected') {
        pagamento.status = StatusPagamento.RECUSADO;
      } else if (statusMercadoPago.status === 'pending') {
        pagamento.status = StatusPagamento.PENDENTE;
      }

      await this.pagamentoRepo.save(pagamento);
      return pagamento;
    } catch (error) {
      throw new Error('Erro ao consultar status do pagamento');
    }
  }

  // Testa se o token do Mercado Pago está funcionando
  async testarTokenMercadoPago(): Promise<{
    sucesso: boolean;
    tokenConfigurado: boolean;
    ambiente: string;
    mensagem: string;
    detalhes?: any;
  }> {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const tokenConfigurado = !!process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!tokenConfigurado) {
      return {
        sucesso: false,
        tokenConfigurado: false,
        ambiente: nodeEnv,
        mensagem: 'MERCADO_PAGO_ACCESS_TOKEN não está configurado no Railway. Configure a variável de ambiente.',
      };
    }

    try {
      // Tenta criar um pagamento PIX de teste (valor mínimo: R$ 0,01)
      // Isso vai validar se o token está funcionando
      const response = await this.mercadoPagoService.criarPagamentoPix(
        0.01,
        'Teste de conexão - Sistema de Entregas',
        'teste@teste.com',
      );

      return {
        sucesso: true,
        tokenConfigurado: true,
        ambiente: nodeEnv,
        mensagem: 'Token do Mercado Pago está funcionando corretamente! ✅',
        detalhes: {
          paymentId: response.id,
          status: response.status,
          temQRCode: !!response.point_of_interaction?.transaction_data?.qr_code,
        },
      };
    } catch (error: any) {
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.message || error.message;
      const errorDetails = error?.response?.data;

      return {
        sucesso: false,
        tokenConfigurado: true,
        ambiente: nodeEnv,
        mensagem: `Erro ao testar token: ${errorMessage}`,
        detalhes: {
          status,
          error: errorDetails,
          sugestao: status === 401 
            ? 'Token inválido ou expirado. Verifique se está usando o Access Token correto (deve começar com APP_USR-).'
            : status === 403
            ? 'Token sem permissões. Verifique se a chave PIX está habilitada na sua conta do Mercado Pago.'
            : 'Verifique os logs do backend para mais detalhes.',
        },
      };
    }
  }
}

