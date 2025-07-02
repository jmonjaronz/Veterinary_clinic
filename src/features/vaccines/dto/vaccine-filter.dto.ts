import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class VaccineFilterDto {
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
    species_vaccination_plan_id?: number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    application_age_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    application_age_max?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    validity_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    validity_max?: number;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_mandatory?: boolean;
}