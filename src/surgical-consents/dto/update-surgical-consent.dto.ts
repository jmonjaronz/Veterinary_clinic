import { IsOptional, IsNumber, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSurgicalConsentDto {
    @IsOptional()
    @IsNumber({}, { message: 'El ID de la cita debe ser un número' })
    appointment_id?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
    pet_id?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID del propietario debe ser un número' })
    owner_id?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
    veterinarian_id?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID del tipo de procedimiento debe ser un número' })
    procedure_type_id?: number;

    @IsOptional()
    @IsString({ message: 'Los comentarios deben ser una cadena de texto' })
    comments?: string;

    @IsOptional()
    @IsString({ message: 'El documento firmado debe ser una cadena de texto' })
    signed_document?: string;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    status?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha programada debe ser una fecha válida' })
    scheduled_date?: Date;
}