import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';

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

  @OneToMany(() => Pedido, (pedido) => pedido.entregador)
  pedidos!: Pedido[];
}

