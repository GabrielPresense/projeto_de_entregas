import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pagamento } from './pagamento.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { PagamentosService } from './pagamentos.service';
import { PagamentosController } from './pagamentos.controller';
import { MercadoPagoService } from './mercado-pago.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pagamento, Pedido])],
  controllers: [PagamentosController],
  providers: [PagamentosService, MercadoPagoService],
  exports: [PagamentosService],
})
export class PagamentosModule {}

