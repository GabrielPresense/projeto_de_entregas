import { Module, forwardRef } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [forwardRef(() => PedidosModule)],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class TrackingModule {}

