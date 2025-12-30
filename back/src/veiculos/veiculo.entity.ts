import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Rota } from '../rotas/rota.entity';

export enum TipoVeiculo {
  MOTO = 'moto',
  CARRO = 'carro',
  VAN = 'van',
  CAMINHAO = 'caminhao',
}

@Entity({ name: 'veiculos' })
export class Veiculo {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 7, unique: true })
  placa!: string;

  @Column({ type: 'varchar', length: 255 })
  modelo!: string;

  @Column({ type: 'varchar', length: 255 })
  marca!: string;

  @Column({
    type: 'enum',
    enum: TipoVeiculo,
  })
  tipo!: TipoVeiculo;

  @Column({ type: 'int' })
  capacidade!: number;

  @Column({ type: 'boolean', default: true })
  disponivel!: boolean;

  @OneToMany(() => Rota, (rota) => rota.veiculo)
  rotas!: Rota[];
}

