import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateVaccineDto {
    @IsNotEmpty({ message: 'El ID del plan de vacunación es requerido' })
    @IsNumber({}, { message: 'El ID del plan de vacunación debe ser un número' })
    species_vaccination_plan_id: number;

    @IsNotEmpty({ message: 'El nombre de la vacuna es requerido' })
    @IsString({ message: 'El nombre de la vacuna debe ser una cadena de texto' })
    name: string;

    @IsNotEmpty({ message: 'La edad de aplicación es requerida' })
    @IsNumber({}, { message: 'La edad de aplicación debe ser un número' })
    @Min(0, { message: 'La edad de aplicación no puede ser negativa' })
    application_age: number;

    @IsNotEmpty({ message: 'La vigencia es requerida' })
    @IsNumber({}, { message: 'La vigencia debe ser un número' })
    @Min(1, { message: 'La vigencia debe ser de al menos 1 mes' })
    validity: number;

    @IsOptional()
    @IsBoolean({ message: 'El campo obligatorio debe ser un valor booleano' })
    is_mandatory?: boolean;
}