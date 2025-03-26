import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class PersonFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    full_name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    dni?: string;

    @IsOptional()
    @IsString()
    role?: string;
}