import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entregador } from './entregador.entity';
import { EntregadoresService } from './entregadores.service';
import { EntregadoresController } from './entregadores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entregador])],
  controllers: [EntregadoresController],
  providers: [EntregadoresService],
  exports: [EntregadoresService],
})
export class EntregadoresModule {}

