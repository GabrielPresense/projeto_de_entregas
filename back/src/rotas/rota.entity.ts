import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Veiculo } from '../veiculos/veiculo.entity';
import { Pedido } from '../pedidos/pedido.entity';

export enum StatusRota {
  PLANEJADA = 'planejada',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada',
}

@Entity({ name: 'rotas' })
export class Rota {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  nome!: string;

  @Column({ type: 'text' })
  descricao!: string;

  @Column({
    type: 'enum',
    enum: StatusRota,
    default: StatusRota.PLANEJADA,
  })
  status!: StatusRota;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distancia!: string;

  @Column({ type: 'int' })
  tempoEstimado!: number;

  @ManyToOne(() => Veiculo, (veiculo) => veiculo.rotas)
  veiculo!: Veiculo;

  @OneToMany(() => Pedido, (pedido) => pedido.rota)
  pedidos!: Pedido[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}

