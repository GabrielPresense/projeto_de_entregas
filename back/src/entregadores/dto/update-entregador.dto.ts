import { PartialType } from '@nestjs/mapped-types';
import { CreateEntregadorDto } from './create-entregador.dto';

export class UpdateEntregadorDto extends PartialType(CreateEntregadorDto) {}

