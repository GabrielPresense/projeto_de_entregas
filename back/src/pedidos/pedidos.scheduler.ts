import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PedidosService } from './pedidos.service';

@Injectable()
export class PedidosScheduler {
  private readonly logger = new Logger(PedidosScheduler.name);

  constructor(private readonly pedidosService: PedidosService) {}

  // Roda a cada 5 minutos para verificar e deletar pedidos pendentes expirados
  @Cron(CronExpression.EVERY_5_MINUTES)
  async limparPedidosPendentesExpirados() {
    try {
      const result = await this.pedidosService.removerPedidosPendentesExpirados();
      if (result.deleted > 0) {
        this.logger.log(
          `Removidos ${result.deleted} pedido(s) pendente(s) expirado(s) (sem pagamento há mais de 30 minutos)`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Erro ao limpar pedidos pendentes expirados:',
        error,
      );
    }
  }
}

