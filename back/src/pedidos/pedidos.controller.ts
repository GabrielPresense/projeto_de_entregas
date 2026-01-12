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
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { StatusPedido } from './pedido.entity';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  @Post()
  async create(@Body() body: CreatePedidoDto) {
    return await this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('bulk-delete')
  async removeByStatus(@Body() body: { statuses: StatusPedido[] }) {
    const result = await this.service.removeByStatus(body.statuses);
    return {
      message: `${result.deleted} pedido(s) removido(s) com sucesso`,
      deleted: result.deleted,
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePedidoDto,
  ) {
    return await this.service.update(id, body);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: StatusPedido },
  ) {
    return await this.service.updateStatus(id, body.status);
  }

  @Put(':id/location')
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLocationDto,
  ) {
    return await this.service.updateLocation(id, body);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Pedido removido com sucesso' };
  }
}

