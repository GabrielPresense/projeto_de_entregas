import { IsDecimal, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StatusRota } from '../rota.entity';

export class CreateRotaDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsOptional()
  @IsEnum(StatusRota)
  status?: StatusRota;

  @IsDecimal()
  @IsNotEmpty()
  distancia!: string;

  @IsInt()
  @IsNotEmpty()
  tempoEstimado!: number;

  @IsNumber()
  @IsNotEmpty()
  veiculoId!: number;
}

