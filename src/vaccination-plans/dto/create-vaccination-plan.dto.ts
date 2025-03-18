import { IsNotEmpty, IsNumber, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVaccinationPlanDto {
    @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
    @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
    pet_id: number;

    @IsNotEmpty({ message: 'El ID del plan de vacunación por especie es requerido' })
    @IsNumber({}, { message: 'El ID del plan de vacunación por especie debe ser un número' })
    species_vaccination_plan_id: number;

    @IsNotEmpty({ message: 'La fecha programada es requerida' })
    @Type(() => Date)
    @IsDate({ message: 'La fecha programada debe ser una fecha válida' })
    scheduled_date: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha de administración debe ser una fecha válida' })
    administered_date?: Date;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    status?: string;
}