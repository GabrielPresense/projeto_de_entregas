import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Veiculo } from './veiculo.entity';
import { Entregador } from '../entregadores/entregador.entity';
import { VeiculosService } from './veiculos.service';
import { VeiculosController } from './veiculos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Veiculo, Entregador])],
  controllers: [VeiculosController],
  providers: [VeiculosService],
  exports: [VeiculosService],
})
export class VeiculosModule {}

