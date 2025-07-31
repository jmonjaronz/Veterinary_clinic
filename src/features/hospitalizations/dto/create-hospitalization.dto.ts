import { IsNotEmpty, IsNumber, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHospitalizationDto {
  @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
  pet_id: number;

  @IsNotEmpty({ message: 'El ID del veterinario es requerido' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
  veterinarian_id: number;

  @IsNotEmpty({ message: 'La razón de hospitalización es requerida' })
  @IsString({ message: 'La razón debe ser una cadena de texto' })
  reason: string;

  @IsNotEmpty({ message: 'El tratamiento es requerido' })
  @IsString({ message: 'El tratamiento debe ser una cadena de texto' })
  treatment: string;

  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description: string;

  @IsNotEmpty({ message: 'La fecha de admisión es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'La fecha de admisión debe ser una fecha válida' })
  admission_date: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de alta debe ser una fecha válida' })
  discharge_date?: Date;
}
