import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadConsentDocumentDto {
    @IsNumber()
    @Type(() => Number)
    petId: number;
}