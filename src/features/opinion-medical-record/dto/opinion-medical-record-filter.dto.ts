import { IsOptional, IsString, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class OpinionFilterDto {
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
  user_id?: number;

  @IsOptional()
  @Type(() => Date)
  date_start?: Date;

  @IsOptional()
  @Type(() => Date)
  date_end?: Date;

  @IsOptional()
  @IsString()
  comment_contains?: string;

  @IsOptional()
  @IsString()
  observations_contains?: string;
}
