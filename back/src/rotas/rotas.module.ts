import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rota } from './rota.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { RotasService } from './rotas.service';
import { RotasController } from './rotas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rota, Veiculo])],
  controllers: [RotasController],
  providers: [RotasService],
  exports: [RotasService],
})
export class RotasModule {}

