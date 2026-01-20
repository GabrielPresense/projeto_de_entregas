import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pedido, StatusPedido } from './pedido.entity';
import { Entregador } from '../entregadores/entregador.entity';
import { Rota } from '../rotas/rota.entity';
import { Pagamento, StatusPagamento } from '../pagamentos/pagamento.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(Entregador)
    private readonly entregadorRepo: Repository<Entregador>,
    @InjectRepository(Rota)
    private readonly rotaRepo: Repository<Rota>,
    @InjectRepository(Pagamento)
    private readonly pagamentoRepo: Repository<Pagamento>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => TrackingGateway))
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(data: CreatePedidoDto): Promise<Pedido> {
    const pedido = this.pedidoRepo.create({
      descricao: data.descricao,
      enderecoOrigem: data.enderecoOrigem,
      enderecoDestino: data.enderecoDestino,
      valor: data.valor,
      status: data.status ?? StatusPedido.PENDENTE,
    });

    if (data.entregadorId) {
      const entregador = await this.entregadorRepo.findOne({
        where: { id: data.entregadorId },
      });
      if (!entregador)
        throw new NotFoundException('Entregador não encontrado');
      pedido.entregador = entregador;
    }

    if (data.rotaId) {
      const rota = await this.rotaRepo.findOne({
        where: { id: data.rotaId },
      });
      if (!rota) throw new NotFoundException('Rota não encontrada');
      pedido.rota = rota;
    }

    return await this.pedidoRepo.save(pedido);
  }

  async findAll(): Promise<Pedido[]> {
    return this.pedidoRepo.find({
      relations: ['entregador', 'rota', 'pagamento'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['entregador', 'rota', 'pagamento'],
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    return pedido;
  }

  async update(id: number, data: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (data.descricao !== undefined) pedido.descricao = data.descricao;
    if (data.enderecoOrigem !== undefined)
      pedido.enderecoOrigem = data.enderecoOrigem;
    if (data.enderecoDestino !== undefined)
      pedido.enderecoDestino = data.enderecoDestino;
    if (data.valor !== undefined) pedido.valor = data.valor;
    if (data.status !== undefined) pedido.status = data.status;

    if (data.entregadorId !== undefined) {
      const entregador = await this.entregadorRepo.findOne({
        where: { id: data.entregadorId },
      });
      if (!entregador)
        throw new NotFoundException('Entregador não encontrado');
      pedido.entregador = entregador;
    }

    if (data.rotaId !== undefined) {
      const rota = await this.rotaRepo.findOne({
        where: { id: data.rotaId },
      });
      if (!rota) throw new NotFoundException('Rota não encontrada');
      pedido.rota = rota;
    }

    pedido.updatedAt = new Date();
    return await this.pedidoRepo.save(pedido);
  }

  async remove(id: number): Promise<void> {
    const result = await this.pedidoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Pedido não encontrado');
    }
  }

  async removeByStatus(statuses: StatusPedido[]): Promise<{ deleted: number }> {
    const result = await this.pedidoRepo
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', { statuses })
      .execute();
    return { deleted: result.affected || 0 };
  }

  // Deleta apenas pedidos pendentes criados há mais de 30 minutos que NÃO têm pagamento associado
  // Se o pedido tem pagamento (mesmo que pendente), não deleta, pois quando pagar o status muda
  async removerPedidosPendentesExpirados(): Promise<{ deleted: number }> {
    const trintaMinutosAtras = new Date(Date.now() - 30 * 60 * 1000);
    
    // Busca pedidos pendentes criados há mais de 30 minutos que NÃO têm pagamento associado
    const pedidosExpirados = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .leftJoin('pedido.pagamento', 'pagamento')
      .where('pedido.status = :status', { status: StatusPedido.PENDENTE })
      .andWhere('pedido.createdAt < :dataLimite', { dataLimite: trintaMinutosAtras })
      .andWhere('pagamento.id IS NULL') // Apenas pedidos SEM pagamento
      .getMany();

    if (pedidosExpirados.length === 0) {
      return { deleted: 0 };
    }

    const pedidoIds = pedidosExpirados.map(p => p.id);

    // Deleta apenas os pedidos (não tem pagamentos para deletar)
    const result = await this.pedidoRepo
      .createQueryBuilder()
      .delete()
      .from(Pedido)
      .where('id IN (:...ids)', { ids: pedidoIds })
      .execute();

    return { deleted: result.affected || 0 };
  }

  async updateLocation(
    id: number,
    location: UpdateLocationDto,
  ): Promise<Pedido> {
    const pedido = await this.findOne(id);
    pedido.latitudeAtual = location.latitude.toString();
    pedido.longitudeAtual = location.longitude.toString();
    pedido.updatedAt = new Date();
    return await this.pedidoRepo.save(pedido);
  }

  async updateStatus(id: number, status: StatusPedido): Promise<Pedido> {
    const pedido = await this.findOne(id);
    pedido.status = status;
    pedido.updatedAt = new Date();
    const savedPedido = await this.pedidoRepo.save(pedido);
    
    // Notifica via WebSocket
    await this.trackingGateway.notifyStatusChange(id, status);
    
    return savedPedido;
  }
}

