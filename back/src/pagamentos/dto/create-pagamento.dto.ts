import { IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MetodoPagamento, StatusPagamento } from '../pagamento.entity';

export class CreatePagamentoDto {
  @IsDecimal()
  @IsNotEmpty()
  valor!: string;

  @IsEnum(MetodoPagamento)
  @IsNotEmpty()
  metodoPagamento!: MetodoPagamento;

  @IsEnum(StatusPagamento)
  @IsOptional()
  status?: StatusPagamento;

  @IsNumber()
  @IsNotEmpty()
  pedidoId!: number;

  @IsString()
  @IsOptional()
  transacaoId?: string;
}

