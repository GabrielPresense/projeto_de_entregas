import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntregadoresModule } from './entregadores/entregadores.module';
import { VeiculosModule } from './veiculos/veiculos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { RotasModule } from './rotas/rotas.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbSynchronize = process.env.DB_SYNCHRONIZE;
        const nodeEnv = process.env.NODE_ENV;
        const shouldSynchronize = dbSynchronize === 'true' || nodeEnv !== 'production';
        
        return {
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || 3306),
          username: process.env.DB_USER || 'usuario',
          password: process.env.DB_PASS || '15789',
          database: process.env.DB_NAME || 'base_de_dados',
          autoLoadEntities: true,
          synchronize: shouldSynchronize,
          logging: shouldSynchronize ? ['schema', 'error', 'warn', 'info'] : false,
        };
      },
    }),
    EntregadoresModule,
    VeiculosModule,
    PedidosModule,
    RotasModule,
    PagamentosModule,
    TrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
