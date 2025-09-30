import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateOpinionDto {
  @IsNotEmpty({ message: 'El ID del registro médico es requerido' })
  @IsNumber({}, { message: 'El ID del registro médico debe ser un número' })
  medical_record_id: number;

  @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
  @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
  pet_id: number;

  @IsNotEmpty({ message: 'El ID del propietario es requerido' })
  @IsNumber({}, { message: 'El ID del propietario debe ser un número' })
  owner_id: number;

  @IsNotEmpty({ message: 'El comentario es requerido' })
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  comment: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  observations?: string;
}
