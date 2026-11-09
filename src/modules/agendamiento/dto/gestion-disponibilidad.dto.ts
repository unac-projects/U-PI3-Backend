import { IsInt, IsDateString, IsString, IsEnum } from 'class-validator';
import { EstadoDisponibilidad } from '@prisma/client';

export class GestionDisponibilidadDto {
  @IsInt()
  profesionalId: number;

  @IsDateString()
  fecha: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsEnum(EstadoDisponibilidad)
  estado: EstadoDisponibilidad;
}
