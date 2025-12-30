import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { EntregadoresService } from './entregadores.service';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';

@Controller('entregadores')
export class EntregadoresController {
  constructor(private readonly service: EntregadoresService) {}

  @Post()
  async create(@Body() body: CreateEntregadorDto) {
    return await this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEntregadorDto,
  ) {
    return await this.service.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Entregador removido com sucesso' };
  }

  @Post(':id/veiculos/:veiculoId')
  async adicionarVeiculo(
    @Param('id', ParseIntPipe) id: number,
    @Param('veiculoId', ParseIntPipe) veiculoId: number,
  ) {
    return await this.service.adicionarVeiculo(id, veiculoId);
  }

  @Delete(':id/veiculos/:veiculoId')
  async removerVeiculo(
    @Param('id', ParseIntPipe) id: number,
    @Param('veiculoId', ParseIntPipe) veiculoId: number,
  ) {
    return await this.service.removerVeiculo(id, veiculoId);
  }
}

