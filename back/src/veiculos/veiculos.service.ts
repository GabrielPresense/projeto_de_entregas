import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Veiculo } from './veiculo.entity';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';

@Injectable()
export class VeiculosService {
  constructor(
    @InjectRepository(Veiculo)
    private readonly veiculoRepo: Repository<Veiculo>,
  ) {}

  async create(data: CreateVeiculoDto): Promise<Veiculo> {
    const veiculo = this.veiculoRepo.create({
      placa: data.placa,
      modelo: data.modelo,
      marca: data.marca,
      tipo: data.tipo,
      capacidade: data.capacidade,
      disponivel: data.disponivel ?? true,
    });
    return await this.veiculoRepo.save(veiculo);
  }

  async findAll(): Promise<Veiculo[]> {
    return this.veiculoRepo.find({
      relations: ['rotas'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Veiculo> {
    const veiculo = await this.veiculoRepo.findOne({
      where: { id },
      relations: ['rotas'],
    });
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');
    return veiculo;
  }

  async update(id: number, data: UpdateVeiculoDto): Promise<Veiculo> {
    const veiculo = await this.findOne(id);
    Object.assign(veiculo, data);
    return await this.veiculoRepo.save(veiculo);
  }

  async remove(id: number): Promise<void> {
    const result = await this.veiculoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Veículo não encontrado');
    }
  }

  async findDisponiveis(): Promise<Veiculo[]> {
    return this.veiculoRepo.find({
      where: { disponivel: true },
      order: { id: 'DESC' },
    });
  }
}

