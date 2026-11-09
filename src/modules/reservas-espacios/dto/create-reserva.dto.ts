import { IsNotEmpty, IsString, IsInt, Min, IsDateString } from 'class-validator';

export class CreateReservaDto {
  @IsInt()
  @IsNotEmpty()
  usuarioId: number;

  @IsString()
  @IsNotEmpty()
  espacioId: string;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string; // Formato ISO ej: "2026-11-06T10:00:00.000Z"

  @IsInt()
  @Min(1)
  cantidadPersonas: number;
}