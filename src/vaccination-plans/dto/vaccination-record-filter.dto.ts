import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class VaccinationRecordFilterDto {
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
    vaccination_plan_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    vaccine_id?: number;

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

    // Filtros para la vacuna relacionada
    @IsOptional()
    @IsString()
    vaccine_name?: string;
}