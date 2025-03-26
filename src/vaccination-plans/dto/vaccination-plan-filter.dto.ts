import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class VaccinationPlanFilterDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    per_page: number = 10;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    pet_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    species_vaccination_plan_id?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @Type(() => Date)
    scheduled_date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    scheduled_date_end?: Date;

    @IsOptional()
    @Type(() => Date)
    administered_date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    administered_date_end?: Date;

    // Filtros para la mascota relacionada
    @IsOptional()
    @IsString()
    pet_name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    owner_id?: number;

    @IsOptional()
    @IsString()
    owner_name?: string;

    // Filtros para el plan de vacunación por especie
    @IsOptional()
    @IsString()
    vaccine?: string;
}