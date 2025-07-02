import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateSpeciesVaccinationPlanDto {
    @IsOptional()
    @IsNumber({}, { message: 'El ID de la especie debe ser un número' })
    species_id?: number;

    @IsOptional()
    @IsString({ message: 'El nombre del plan debe ser una cadena de texto' })
    name?: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;
}