import { Expose, Type } from 'class-transformer';
import { MedicalRecordResponseDto } from 'src/features/medical-records/dto/medical-record-response.dto';

export class TreatmentResponseDto {
  @Expose() id: number;

  @Expose() medical_record_id: number;

  @Type(() => MedicalRecordResponseDto)
  @Expose() medical_record: MedicalRecordResponseDto;

  @Expose() date: Date;

  @Expose() medication: boolean;

  @Expose() description: string;

  @Expose() dose: string;

  @Expose() frequency: string;

  @Expose() duration: string;

  @Expose() observations: string;

   @Expose() medications: string;

  @Expose() created_at: Date;

  @Expose() updatedAt: Date;

  @Expose() deletedAt: Date | null;
}
