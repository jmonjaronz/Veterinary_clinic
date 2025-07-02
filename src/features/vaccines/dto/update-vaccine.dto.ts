import { IsOptional, IsNumber, IsString, IsBoolean, Min } from 'class-validator';

export class UpdateVaccineDto {
    @IsOptional()
    @IsNumber({}, { message: 'El ID del plan de vacunación debe ser un número' })
    species_vaccination_plan_id?: number;

    @IsOptional()
    @IsString({ message: 'El nombre de la vacuna debe ser una cadena de texto' })
    name?: string;

    @IsOptional()
    @IsNumber({}, { message: 'La edad de aplicación debe ser un número' })
    @Min(0, { message: 'La edad de aplicación no puede ser negativa' })
    application_age?: number;

    @IsOptional()
    @IsNumber({}, { message: 'La vigencia debe ser un número' })
    @Min(1, { message: 'La vigencia debe ser de al menos 1 mes' })
    validity?: number;

    @IsOptional()
    @IsBoolean({ message: 'El campo obligatorio debe ser un valor booleano' })
    is_mandatory?: boolean;
}