import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SpeciesVaccinationPlanFilterDto {
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
    species_id?: number;

    @IsOptional()
    @IsString()
    vaccine?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    recommended_age_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    recommended_age_max?: number;

    @IsOptional()
    @IsString()
    species_name?: string;
}