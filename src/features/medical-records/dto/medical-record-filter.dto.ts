import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MedicalRecordFilterDto {
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
    @Type(() => Number)
    @IsInt()
    appointment_id?: number;

    @IsOptional()
    @IsString()
    diagnosis_contains?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    treatment_contains?: string;

    @IsOptional()
    @IsString()
    prescriptions_contains?: string;

    @IsOptional()
    @Type(() => Date)
    appointment_date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    appointment_date_end?: Date;

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

    // Filtros para el veterinario
    @IsOptional()
    @IsString()
    veterinarian_name?: string;
}