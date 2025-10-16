import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
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
  @Type(() => Boolean)
  @IsBoolean()
  medication?: boolean;

  @IsOptional()
  @Type(() => Date)
  date_start?: Date;

  @IsOptional()
  @Type(() => Date)
  date_end?: Date;

  @IsOptional()
  @IsString()
  description_contains?: string;

  @IsOptional()
  @IsString()
  dose_contains?: string;

  @IsOptional()
  @IsString()
  frequency_contains?: string;

  @IsOptional()
  @IsString()
  temperature?: string;

  @IsOptional()
  @IsString()
  blood_pressure?: string;

  @IsOptional()
  @IsString()
  duration_contains?: string;

  @IsOptional()
  @IsString()
  observations_contains?: string;
}
