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
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const shouldSynchronize = process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production';
        
        // Log para debug
        console.log('🔍 DB_SYNCHRONIZE:', process.env.DB_SYNCHRONIZE);
        console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
        console.log('🔍 synchronize será:', shouldSynchronize);
        
        return {
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || 3306),
          username: process.env.DB_USER || 'usuario',
          password: process.env.DB_PASS || '15789',
          database: process.env.DB_NAME || 'base_de_dados',
          autoLoadEntities: true,
          // Em produção, habilita synchronize temporariamente para criar as tabelas
          // Depois de criar, pode desabilitar novamente por segurança
          synchronize: shouldSynchronize,
          logging: shouldSynchronize ? ['schema', 'error', 'warn'] : false,
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
