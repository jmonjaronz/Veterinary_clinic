import { IsOptional, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UploadPetImageDto {
    @IsNumber()
    @Type(() => Number)
    petId: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return Boolean(value);
    })
    isMain?: boolean;
}