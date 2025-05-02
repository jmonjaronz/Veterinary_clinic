import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SurgicalConsentFilterDto {
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
    appointment_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    pet_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    owner_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    veterinarian_id?: number;

    @IsOptional()
    @IsString()
    procedure_type?: string;

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
    created_at_start?: Date;

    @IsOptional()
    @Type(() => Date)
    created_at_end?: Date;

    // Filtros para entidades relacionadas
    @IsOptional()
    @IsString()
    pet_name?: string;

    @IsOptional()
    @IsString()
    owner_name?: string;

    @IsOptional()
    @IsString()
    veterinarian_name?: string;

    @IsOptional()
    @IsString()
    has_signed_document?: 'yes' | 'no';
}