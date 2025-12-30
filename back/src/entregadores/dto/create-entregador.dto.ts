import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { StatusEntregador } from '../entregador.entity';

export class CreateEntregadorDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  telefone!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(StatusEntregador)
  status?: StatusEntregador;
}

