import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entregador } from './entregador.entity';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';

@Injectable()
export class EntregadoresService {
  constructor(
    @InjectRepository(Entregador)
    private readonly entregadorRepo: Repository<Entregador>,
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
      relations: ['pedidos'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Entregador> {
    const entregador = await this.entregadorRepo.findOne({
      where: { id },
      relations: ['pedidos'],
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
}

