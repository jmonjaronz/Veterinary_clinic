import { IsOptional, IsNumber, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHospitalizationDto {
    @IsOptional()
    @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
    pet_id?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
    veterinarian_id?: number;

    @IsOptional()
    @IsString({ message: 'La razón debe ser una cadena de texto' })
    reason?: string;

    @IsOptional()
    @IsString({ message: 'El documento de consentimiento debe ser una cadena de texto' })
    consent_document?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha de admisión debe ser una fecha válida' })
    admission_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha de alta debe ser una fecha válida' })
    discharge_date?: Date;
}