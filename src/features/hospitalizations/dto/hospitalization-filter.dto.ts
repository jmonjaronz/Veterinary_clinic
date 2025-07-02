import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class HospitalizationFilterDto {
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
    veterinarian_id?: number;

    @IsOptional()
    @IsString()
    reason_contains?: string;

    @IsOptional()
    @Type(() => Date)
    admission_date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    admission_date_end?: Date;

    @IsOptional()
    @Type(() => Date)
    discharge_date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    discharge_date_end?: Date;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    // Filtros para mascota relacionada
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

    // Filtros para veterinario
    @IsOptional()
    @IsString()
    veterinarian_name?: string;
}