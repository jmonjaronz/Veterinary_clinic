import { IsNotEmpty, IsNumber, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
    @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
    @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
    pet_id: number;

    @IsNotEmpty({ message: 'El ID del veterinario es requerido' })
    @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
    veterinarian_id: number;

    @IsNotEmpty({ message: 'El tipo de cita es requerido' })
    @IsString({ message: 'El tipo de cita debe ser una cadena de texto' })
    appointment_type: string;

    @IsOptional()
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    type: string;

    @IsNotEmpty({ message: 'La fecha de la cita es requerida' })
    @Type(() => Date)
    @IsDate({ message: 'La fecha de la cita debe ser una fecha válida' })
    date: Date;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    status?: string;

    @IsOptional()
    @IsString({ message: 'El documento debe ser una cadena de texto' })
    document?: string;
}