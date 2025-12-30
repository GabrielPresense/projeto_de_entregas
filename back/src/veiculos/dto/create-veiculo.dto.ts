import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { TipoVeiculo } from '../veiculo.entity';

export class CreateVeiculoDto {
  @IsString()
  @IsNotEmpty()
  placa!: string;

  @IsString()
  @IsNotEmpty()
  modelo!: string;

  @IsString()
  @IsNotEmpty()
  marca!: string;

  @IsEnum(TipoVeiculo)
  tipo!: TipoVeiculo;

  @IsInt()
  capacidade!: number;

  @IsBoolean()
  disponivel?: boolean;
}

