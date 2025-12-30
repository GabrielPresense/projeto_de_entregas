import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entregador } from './entregador.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';

@Injectable()
export class EntregadoresService {
  constructor(
    @InjectRepository(Entregador)
    private readonly entregadorRepo: Repository<Entregador>,
    @InjectRepository(Veiculo)
    private readonly veiculoRepo: Repository<Veiculo>,
  ) {}

  async create(data: CreateEntregadorDto): Promise<Entregador> {
    const entregador = this.entregadorRepo.create({
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      status: data.status,
    });
    return await this.entregadorRepo.save(entregador);
  }

  async findAll(): Promise<Entregador[]> {
    return this.entregadorRepo.find({
      relations: ['pedidos', 'veiculos'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Entregador> {
    const entregador = await this.entregadorRepo.findOne({
      where: { id },
      relations: ['pedidos', 'veiculos'],
    });
    if (!entregador) throw new NotFoundException('Entregador não encontrado');
    return entregador;
  }

  async update(id: number, data: UpdateEntregadorDto): Promise<Entregador> {
    const entregador = await this.findOne(id);
    Object.assign(entregador, data);
    return await this.entregadorRepo.save(entregador);
  }

  async remove(id: number): Promise<void> {
    const result = await this.entregadorRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Entregador não encontrado');
    }
  }

  async adicionarVeiculo(
    entregadorId: number,
    veiculoId: number,
  ): Promise<Entregador> {
    const entregador = await this.findOne(entregadorId);
    const veiculo = await this.veiculoRepo.findOne({
      where: { id: veiculoId },
    });
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');

    if (!entregador.veiculos) entregador.veiculos = [];
    if (!entregador.veiculos.find((v) => v.id === veiculoId)) {
      entregador.veiculos.push(veiculo);
      await this.entregadorRepo.save(entregador);
    }

    return this.findOne(entregadorId);
  }

  async removerVeiculo(
    entregadorId: number,
    veiculoId: number,
  ): Promise<Entregador> {
    const entregador = await this.findOne(entregadorId);
    entregador.veiculos = entregador.veiculos?.filter(
      (v) => v.id !== veiculoId,
    ) || [];
    await this.entregadorRepo.save(entregador);
    return this.findOne(entregadorId);
  }
}

