import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TreatmentFilterDto {
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
    medical_record_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    pet_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    veterinarian_id?: number;

    @IsOptional()
    @Type(() => Date)
    date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    date_end?: Date;

    @IsOptional()
    @IsString()
    reason_contains?: string;

    @IsOptional()
    @IsString()
    diagnosis_contains?: string;

    @IsOptional()
    @IsString()
    treatment_contains?: string;

    @IsOptional()
    @IsString()
    examinations_contains?: string;

    // Filtros para la mascota relacionada
    @IsOptional()
    @IsString()
    pet_name?: string;

    // Filtros para el veterinario
    @IsOptional()
    @IsString()
    veterinarian_name?: string;
}