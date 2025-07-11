import { IsOptional, IsNumber, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMedicalRecordDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
  pet_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de la cita debe ser un número' })
  appointment_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
  veterinarian_id?: number;

  @IsOptional()
  @IsString({ message: 'El diagnóstico debe ser una cadena de texto' })
  diagnosis?: string;

  @IsOptional()
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  type?: string;

  @IsOptional()
  @IsString({ message: 'Las prescripciones deben ser una cadena de texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Las prescripciones deben ser una cadena de texto' })
  lote?: string;

  @IsOptional()
  @IsString({
    message: 'Los tipos de atencion preventiva deben ser una cadena de texto',
  })
  care_type?: string;

  @IsOptional()
  @IsDate({ message: 'La fecha de la cita debe ser una fecha válida' })
  date_next_application?: Date;

  @IsOptional()
  @IsString({
    message: 'La nota de siguiente aplicación deben ser una cadena de texto',
  })
  note_next_application?: string;

  @IsOptional()
  @IsString({ message: 'Las prescripciones deben ser una cadena de texto' })
  prescriptions?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de la cita debe ser una fecha válida' })
  appointment_date?: Date;
}
