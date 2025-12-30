import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pagamento, StatusPagamento } from './pagamento.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { UpdatePagamentoDto } from './dto/update-pagamento.dto';

@Injectable()
export class PagamentosService {
  constructor(
    @InjectRepository(Pagamento)
    private readonly pagamentoRepo: Repository<Pagamento>,
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
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
    pagamento.status = StatusPagamento.PROCESSANDO;
    await this.pagamentoRepo.save(pagamento);

    // Simulação de processamento de pagamento
    // Aqui você integraria com um gateway de pagamento real
    const timer = setTimeout(async () => {
      pagamento.status = StatusPagamento.APROVADO;
      pagamento.processedAt = new Date();
      await this.pagamentoRepo.save(pagamento);
    }, 2000);

    // .unref() permite que o processo Node.js termine mesmo com o timer ativo
    // Isso é importante para testes e não afeta o comportamento em produção
    timer.unref();

    return pagamento;
  }
}

