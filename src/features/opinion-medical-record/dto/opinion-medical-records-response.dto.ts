import { Expose, Type } from 'class-transformer';

export class OpinionResponseDto {
  @Expose()
  id: number;

  @Expose()
  medical_record_id: number;

  @Expose()
  pet_id: number;

  @Expose()
  owner_id: number;

  @Expose()
  user_id: number;

  @Expose()
  comment: string;

  @Expose()
  observations?: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
