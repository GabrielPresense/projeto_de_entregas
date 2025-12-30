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

  async processarPagamento(id: number): Promise<Pagamento> {
    const pagamento = await this.findOne(id);

    if (pagamento.status === StatusPagamento.APROVADO) {
      return pagamento;
    }

    pagamento.status = StatusPagamento.PROCESSANDO;
    await this.pagamentoRepo.save(pagamento);

    try {
      // Se for PIX, integra com Mercado Pago
      if (pagamento.metodoPagamento === MetodoPagamento.PIX) {
        const valor = parseFloat(pagamento.valor);
        const descricao = `Pagamento pedido #${pagamento.pedido.id}`;

        const response = await this.mercadoPagoService.criarPagamentoPix(
          valor,
          descricao,
        );

        // Salva os dados do PIX retornados pelo Mercado Pago
        pagamento.transacaoId = response.id;
        pagamento.qrCode = response.point_of_interaction?.transaction_data?.qr_code;
        pagamento.qrCodeBase64 =
          response.point_of_interaction?.transaction_data?.qr_code_base64;
        pagamento.ticketUrl =
          response.point_of_interaction?.transaction_data?.ticket_url;
        pagamento.status = StatusPagamento.PENDENTE; // PIX fica pendente até ser pago

        await this.pagamentoRepo.save(pagamento);

        return pagamento;
      } else {
        // Para outros métodos de pagamento, simula processamento
        const timer = setTimeout(async () => {
          pagamento.status = StatusPagamento.APROVADO;
          pagamento.processedAt = new Date();
          await this.pagamentoRepo.save(pagamento);
        }, 2000);

        timer.unref(); // Permite que o processo termine mesmo com timer ativo
        return pagamento;
      }
    } catch (error) {
      pagamento.status = StatusPagamento.RECUSADO;
      await this.pagamentoRepo.save(pagamento);
      throw error;
    }
  }

  /**
   * Consulta o status de um pagamento no Mercado Pago
   * Útil para verificar se um pagamento PIX foi aprovado
   */
  async consultarStatusPagamento(id: number): Promise<Pagamento> {
    const pagamento = await this.findOne(id);

    if (!pagamento.transacaoId) {
      return pagamento;
    }

    try {
      const statusMercadoPago =
        await this.mercadoPagoService.consultarPagamento(
          pagamento.transacaoId,
        );

      // Atualiza o status baseado na resposta do Mercado Pago
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
}

