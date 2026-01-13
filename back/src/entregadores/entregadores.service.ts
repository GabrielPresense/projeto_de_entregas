import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Entregador } from './entregador.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { LoginEntregadorDto } from './dto/login-entregador.dto';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';

@Injectable()
export class EntregadoresService {
  constructor(
    @InjectRepository(Entregador)
    private readonly entregadorRepo: Repository<Entregador>,
    @InjectRepository(Veiculo)
    private readonly veiculoRepo: Repository<Veiculo>,
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    private readonly dataSource: DataSource,
  ) {}

  async create(data: CreateEntregadorDto): Promise<Entregador> {
    const senhaHash = await bcrypt.hash('123123', 10);
    const cleanCpf = data.cpf.replace(/\D/g, '');
    const entregador = this.entregadorRepo.create({
      nome: data.nome,
      cpf: cleanCpf,
      telefone: data.telefone,
      email: data.email,
      status: data.status,
      senha: senhaHash,
      temCarroProprio: data.temCarroProprio,
      primeiroLogin: true,
    });
    return await this.entregadorRepo.save(entregador);
  }

  async login(loginDto: LoginEntregadorDto): Promise<{ entregador: Entregador; primeiroLogin: boolean }> {
    const cleanCpf = loginDto.cpf.replace(/\D/g, '');
    // Busca o CPF tanto formatado quanto sem formatação
    const entregador = await this.entregadorRepo.findOne({
      where: [
        { cpf: cleanCpf },
        { cpf: loginDto.cpf },
      ],
      relations: ['pedidos', 'veiculos'],
    });

    if (!entregador) {
      throw new UnauthorizedException('CPF ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(loginDto.senha, entregador.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('CPF ou senha inválidos');
    }

    return {
      entregador,
      primeiroLogin: entregador.primeiroLogin,
    };
  }

  async alterarSenha(id: number, alterarSenhaDto: AlterarSenhaDto): Promise<Entregador> {
    const entregador = await this.findOne(id);

    const senhaAtualValida = await bcrypt.compare(alterarSenhaDto.senhaAtual, entregador.senha);
    if (!senhaAtualValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const novaSenhaHash = await bcrypt.hash(alterarSenhaDto.novaSenha, 10);
    entregador.senha = novaSenhaHash;
    entregador.primeiroLogin = false;

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
    const entregador = await this.entregadorRepo.findOne({
      where: { id },
      relations: ['pedidos', 'veiculos'],
    });
    
    if (!entregador) {
      throw new NotFoundException('Entregador não encontrado');
    }

    // Usa transação para garantir consistência
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Remove veículos associados (relação ManyToMany)
      if (entregador.veiculos && entregador.veiculos.length > 0) {
        entregador.veiculos = [];
        await queryRunner.manager.save(entregador);
      }

      // Remove a referência do entregador dos pedidos (seta como null)
      await queryRunner.manager.update(
        Pedido,
        { entregador: { id } },
        { entregador: null as any }
      );

      // Agora pode deletar o entregador
      await queryRunner.manager.remove(entregador);
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
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

