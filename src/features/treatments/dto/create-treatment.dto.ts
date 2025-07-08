import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTreatmentDto {
  @IsNotEmpty({ message: 'El ID del registro médico es requerido' })
  @IsNumber({}, { message: 'El ID del registro médico debe ser un número' })
  medical_record_id: number;

  @IsNotEmpty({ message: 'La fecha es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  date: Date;

  @IsNotEmpty({ message: 'Debe indicar si hay medicación' })
  @IsBoolean({ message: 'El campo medicación debe ser verdadero o falso' })
  medication: boolean;

  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description: string;

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
