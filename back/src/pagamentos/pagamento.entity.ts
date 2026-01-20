import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';

export enum StatusPagamento {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  REEMBOLSADO = 'reembolsado',
}

export enum MetodoPagamento {
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  PIX = 'pix',
  BOLETO = 'boleto',
  DINHEIRO = 'dinheiro',
}

@Entity({ name: 'pagamentos' })
export class Pagamento {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor!: string;

  @Column({
    type: 'enum',
    enum: MetodoPagamento,
  })
  metodoPagamento!: MetodoPagamento;

  @Column({
    type: 'enum',
    enum: StatusPagamento,
    default: StatusPagamento.PENDENTE,
  })
  status!: StatusPagamento;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transacaoId?: string;

  @Column({ type: 'text', nullable: true })
  qrCode?: string;

  @Column({ type: 'text', nullable: true })
  qrCodeBase64?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ticketUrl?: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.pagamento)
  @JoinColumn()
  pedido!: Pedido;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;
}

