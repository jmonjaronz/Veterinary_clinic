import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/features/users/dto/user-response.dto';

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
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

  @Expose()
  observations?: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
