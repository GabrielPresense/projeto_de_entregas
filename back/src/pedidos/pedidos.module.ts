import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Pedido } from './pedido.entity';
import { Entregador } from '../entregadores/entregador.entity';
import { Rota } from '../rotas/rota.entity';
import { Pagamento } from '../pagamentos/pagamento.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { PedidosScheduler } from './pedidos.scheduler';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Entregador, Rota, Pagamento]),
    ScheduleModule.forRoot(),
    forwardRef(() => TrackingModule),
  ],
  controllers: [PedidosController],
  providers: [PedidosService, PedidosScheduler],
  exports: [PedidosService],
})
export class PedidosModule {}

