import { IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';

export class UpdateSpeciesVaccinationPlanDto {
    @IsOptional()
    @IsNumber({}, { message: 'El ID de la especie debe ser un número' })
    species_id?: number;

    @IsOptional()
    @IsString({ message: 'El nombre de la vacuna debe ser una cadena de texto' })
    vaccine?: string;

    @IsOptional()
    @IsNumber({}, { message: 'La edad recomendada debe ser un número' })
    @IsPositive({ message: 'La edad recomendada debe ser positiva' })
    recommended_age?: number;
}