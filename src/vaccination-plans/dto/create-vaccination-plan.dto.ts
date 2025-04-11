import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateVaccinationPlanDto {
    @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
    @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
    pet_id: number;

    @IsNotEmpty({ message: 'El ID del plan de vacunación por especie es requerido' })
    @IsNumber({}, { message: 'El ID del plan de vacunación por especie debe ser un número' })
    species_vaccination_plan_id: number;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    status?: string;
}