import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entregador } from './entregador.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { EntregadoresService } from './entregadores.service';
import { EntregadoresController } from './entregadores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entregador, Veiculo, Pedido])],
  controllers: [EntregadoresController],
  providers: [EntregadoresService],
  exports: [EntregadoresService],
})
export class EntregadoresModule {}

