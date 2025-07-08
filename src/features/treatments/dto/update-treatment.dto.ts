import { IsOptional, IsNumber, IsDate, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTreatmentDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID del registro médico debe ser un número' })
  medical_record_id?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  date?: Date;

  @IsOptional()
  @IsBoolean({ message: 'El campo medicación debe ser verdadero o falso' })
  medication?: boolean;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'La dosis debe ser una cadena de texto' })
  dose?: string;

  @IsOptional()
  @IsString({ message: 'La frecuencia debe ser una cadena de texto' })
  frequency?: string;

  @IsOptional()
  @IsString({ message: 'La duración debe ser una cadena de texto' })
  duration?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  observations?: string;
}
