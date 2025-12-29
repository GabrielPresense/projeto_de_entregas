import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rota, StatusRota } from './rota.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { CreateRotaDto } from './dto/create-rota.dto';
import { UpdateRotaDto } from './dto/update-rota.dto';

@Injectable()
export class RotasService {
  constructor(
    @InjectRepository(Rota)
    private readonly rotaRepo: Repository<Rota>,
    @InjectRepository(Veiculo)
    private readonly veiculoRepo: Repository<Veiculo>,
  ) {}

  async create(data: CreateRotaDto): Promise<Rota> {
    const veiculo = await this.veiculoRepo.findOne({
      where: { id: data.veiculoId },
    });
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');

    const rota = this.rotaRepo.create({
      nome: data.nome,
      descricao: data.descricao,
      status: data.status ?? StatusRota.PLANEJADA,
      distancia: data.distancia,
      tempoEstimado: data.tempoEstimado,
      veiculo,
    });

    return await this.rotaRepo.save(rota);
  }

  async findAll(): Promise<Rota[]> {
    return this.rotaRepo.find({
      relations: ['veiculo', 'pedidos'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Rota> {
    const rota = await this.rotaRepo.findOne({
      where: { id },
      relations: ['veiculo', 'pedidos'],
    });
    if (!rota) throw new NotFoundException('Rota não encontrada');
    return rota;
  }

  async update(id: number, data: UpdateRotaDto): Promise<Rota> {
    const rota = await this.findOne(id);

    if (data.nome !== undefined) rota.nome = data.nome;
    if (data.descricao !== undefined) rota.descricao = data.descricao;
    if (data.status !== undefined) rota.status = data.status;
    if (data.distancia !== undefined) rota.distancia = data.distancia;
    if (data.tempoEstimado !== undefined)
      rota.tempoEstimado = data.tempoEstimado;

    if (data.veiculoId !== undefined) {
      const veiculo = await this.veiculoRepo.findOne({
        where: { id: data.veiculoId },
      });
      if (!veiculo) throw new NotFoundException('Veículo não encontrado');
      rota.veiculo = veiculo;
    }

    if (data.status === StatusRota.EM_ANDAMENTO && !rota.startedAt) {
      rota.startedAt = new Date();
    }

    if (data.status === StatusRota.CONCLUIDA && !rota.completedAt) {
      rota.completedAt = new Date();
    }

    return await this.rotaRepo.save(rota);
  }

  async remove(id: number): Promise<void> {
    const result = await this.rotaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Rota não encontrada');
    }
  }
}

