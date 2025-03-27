import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationFilterDto {
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
    user_id?: number;

    @IsOptional()
    @IsString()
    type?: string; // recordatorio, alerta, info

    @IsOptional()
    @IsString()
    status?: string; // leída, no_leída

    @IsOptional()
    @IsString()
    message_contains?: string;

    @IsOptional()
    @Type(() => Date)
    created_at_start?: Date;

    @IsOptional()
    @Type(() => Date)
    created_at_end?: Date;

    @IsOptional()
    @Type(() => Date)
    read_at_start?: Date;

    @IsOptional()
    @Type(() => Date)
    read_at_end?: Date;

    @IsOptional()
    @IsBoolean()
    is_read?: boolean;

    // Filtros para usuario relacionado
    @IsOptional()
    @IsString()
    user_type?: string;

    // Filtros para persona relacionada al usuario
    @IsOptional()
    @IsString()
    person_name?: string;
}