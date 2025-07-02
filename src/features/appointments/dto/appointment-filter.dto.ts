import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AppointmentFilterDto {
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
    status?: string; // programada, completada, cancelada

    @IsOptional()
    @IsString()
    appointment_type?: string; // control, emergencia, vacunación

    @IsOptional()
    @Type(() => Date)
    date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    date_end?: Date;

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