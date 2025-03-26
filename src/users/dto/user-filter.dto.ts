import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UserFilterDto {
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
    @IsString()
    user_type?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    person_id?: number;

    // Filtros para los datos de la persona relacionada
    @IsOptional()
    @IsString()
    full_name?: string;

    @IsOptional()
    @IsString()
    email?: string;
}