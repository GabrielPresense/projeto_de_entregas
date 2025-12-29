import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StatusPedido } from '../pedido.entity';

export class CreatePedidoDto {
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsString()
  @IsNotEmpty()
  enderecoOrigem!: string;

  @IsString()
  @IsNotEmpty()
  enderecoDestino!: string;

  @IsDecimal()
  @IsNotEmpty()
  valor!: string;

  @IsEnum(StatusPedido)
  @IsOptional()
  status?: StatusPedido;

  @IsNumber()
  @IsOptional()
  entregadorId?: number;

  @IsNumber()
  @IsOptional()
  rotaId?: number;
}

