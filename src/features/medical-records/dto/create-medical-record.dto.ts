import { IsNotEmpty, IsNumber, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicalRecordDto {
    @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
    @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
    pet_id: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID de la cita debe ser un número' })
    appointment_id?: number;

    @IsNotEmpty({ message: 'El ID del veterinario es requerido' })
    @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
    veterinarian_id: number;

    @IsNotEmpty({ message: 'El diagnóstico es requerido' })
    @IsString({ message: 'El diagnóstico debe ser una cadena de texto' })
    diagnosis: string;

    @IsNotEmpty({ message: 'El tipo es requerido' })
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    type: string;

    @IsOptional()
    @IsString({ message: 'Las prescripciones deben ser una cadena de texto' })
    prescriptions?: string;

    @IsOptional()
    @IsString({ message: 'Las notas deben ser una cadena de texto' })
    notes?: string;

    @IsNotEmpty({ message: 'La fecha de la cita es requerida' })
    @Type(() => Date)
    @IsDate({ message: 'La fecha de la cita debe ser una fecha válida' })
    appointment_date: Date;
}