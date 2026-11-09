import { IsInt, IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { CategoriaServicio } from '@prisma/client';

export class CrearCitaDto {
  @IsInt()
  estudianteId: number;

  @IsInt()
  profesionalId: number;

  @IsEnum(CategoriaServicio)
  servicio: CategoriaServicio;

  @IsDateString()
  fechaHora: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}