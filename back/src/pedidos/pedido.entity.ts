import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Entregador } from '../entregadores/entregador.entity';
import { Rota } from '../rotas/rota.entity';
import { Pagamento } from '../pagamentos/pagamento.entity';

export enum StatusPedido {
  PENDENTE = 'pendente',
  CONFIRMADO = 'confirmado',
  EM_PREPARACAO = 'em_preparacao',
  PRONTO_PARA_ENTREGA = 'pronto_para_entrega',
  EM_TRANSITO = 'em_transito',
  ENTREGUE = 'entregue',
  CANCELADO = 'cancelado',
}

@Entity({ name: 'pedidos' })
export class Pedido {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  descricao!: string;

  @Column({ type: 'varchar', length: 255 })
  enderecoOrigem!: string;

  @Column({ type: 'varchar', length: 255 })
  enderecoDestino!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor!: string;

  @Column({
    type: 'enum',
    enum: StatusPedido,
    default: StatusPedido.PENDENTE,
  })
  status!: StatusPedido;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitudeAtual?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitudeAtual?: string;

  @ManyToOne(() => Entregador, (entregador) => entregador.pedidos, {
    nullable: true,
  })
  entregador?: Entregador;

  @ManyToOne(() => Rota, (rota) => rota.pedidos, { nullable: true })
  rota?: Rota;

  @OneToOne(() => Pagamento, (pagamento) => pagamento.pedido, {
    cascade: true,
  })
  @JoinColumn()
  pagamento?: Pagamento;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date;
}

