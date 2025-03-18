import { IsNotEmpty, IsNumber, IsString, IsPositive } from 'class-validator';

export class CreateSpeciesVaccinationPlanDto {
    @IsNotEmpty({ message: 'El ID de la especie es requerido' })
    @IsNumber({}, { message: 'El ID de la especie debe ser un número' })
    species_id: number;

    @IsNotEmpty({ message: 'El nombre de la vacuna es requerido' })
    @IsString({ message: 'El nombre de la vacuna debe ser una cadena de texto' })
    vaccine: string;

    @IsNotEmpty({ message: 'La edad recomendada es requerida' })
    @IsNumber({}, { message: 'La edad recomendada debe ser un número' })
    @IsPositive({ message: 'La edad recomendada debe ser positiva' })
    recommended_age: number;
}