import { Type } from "class-transformer";
import { IsInt, IsNumberString, IsOptional, IsString, Min } from "class-validator";

export class CompanyFilterDto {
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
    @IsString()
    email?: string;

    @IsOptional()
    @IsNumberString()
    phone_number?: string;

    @IsOptional()
    @IsNumberString()
    ruc?: string;
}