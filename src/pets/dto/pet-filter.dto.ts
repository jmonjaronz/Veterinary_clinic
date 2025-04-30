import { IsOptional, IsString, IsInt, Min, IsNumber, IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PetFilterDto {
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
    name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    owner_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    species_id?: number;

    @IsOptional()
    @IsString()
    breed?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    age_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    age_max?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    birth_date_start?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    birth_date_end?: Date;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    weight_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    weight_max?: number;

    // Nuevo campo para filtrar por sexo
    @IsOptional()
    @IsString()
    @IsIn(['macho', 'hembra'], { message: 'El sexo debe ser "macho" o "hembra"' })
    sex?: string;

    // Filtros para los datos de propietario relacionado
    @IsOptional()
    @IsString()
    owner_name?: string;

    // Filtros para la especie relacionada
    @IsOptional()
    @IsString()
    species_name?: string;

    // Filtro para documento de consentimiento
    @IsOptional()
    @IsString()
    has_consent_document?: 'yes' | 'no';
}