import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSurgicalConsentDto {
    @IsNotEmpty({ message: 'El ID de la cita es requerido' })
    @IsNumber({}, { message: 'El ID de la cita debe ser un número' })
    appointment_id: number;

    @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
    @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
    pet_id: number;

    @IsNotEmpty({ message: 'El ID del propietario es requerido' })
    @IsNumber({}, { message: 'El ID del propietario debe ser un número' })
    owner_id: number;

    @IsNotEmpty({ message: 'El ID del veterinario es requerido' })
    @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
    veterinarian_id: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID del tipo de procedimiento debe ser un número' })
    procedure_type_id?: number;

    @IsOptional()
    @IsString({ message: 'El tipo de procedimiento personalizado debe ser una cadena de texto' })
    custom_procedure_type?: string;

    @IsOptional()
    @IsString({ message: 'Los comentarios deben ser una cadena de texto' })
    comments?: string;

    @IsNotEmpty({ message: 'La fecha programada es requerida' })
    @Type(() => Date)
    @IsDate({ message: 'La fecha programada debe ser una fecha válida' })
    scheduled_date: Date;
}