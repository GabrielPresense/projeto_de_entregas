import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinTable,
} from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { Veiculo } from '../veiculos/veiculo.entity';

export enum StatusEntregador {
  DISPONIVEL = 'disponivel',
  EM_ENTREGA = 'em_entrega',
  INDISPONIVEL = 'indisponivel',
}

@Entity({ name: 'entregadores' })
export class Entregador {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  nome!: string;

  @Column({ type: 'varchar', length: 14, unique: true })
  cpf!: string;

  @Column({ type: 'varchar', length: 20 })
  telefone!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({
    type: 'enum',
    enum: StatusEntregador,
    default: StatusEntregador.DISPONIVEL,
  })
  status!: StatusEntregador;

  @Column({ type: 'varchar', length: 255 })
  senha!: string;

  @Column({ type: 'boolean', default: false })
  temCarroProprio!: boolean;

  @Column({ type: 'boolean', default: true })
  primeiroLogin!: boolean;

  @OneToMany(() => Pedido, (pedido) => pedido.entregador)
  pedidos!: Pedido[];

  @ManyToMany(() => Veiculo, (veiculo) => veiculo.entregadores)
  @JoinTable({
    name: 'entregadores_veiculos',
    joinColumn: { name: 'entregador_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'veiculo_id', referencedColumnName: 'id' },
  })
  veiculos!: Veiculo[];
}

