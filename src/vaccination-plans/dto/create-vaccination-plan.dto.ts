import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateSpeciesVaccinationPlanDto {
    @IsNotEmpty({ message: 'El ID de la especie es requerido' })
    @IsNumber({}, { message: 'El ID de la especie debe ser un número' })
    species_id: number;

    @IsNotEmpty({ message: 'El nombre del plan es requerido' })
    @IsString({ message: 'El nombre del plan debe ser una cadena de texto' })
    name: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;
}