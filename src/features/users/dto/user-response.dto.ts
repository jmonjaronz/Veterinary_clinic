import { Expose, Type } from 'class-transformer';
import { PersonResponseDto } from 'src/features/persons/dto/person-response.dto';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  user_type: string;

  @Expose({ name: 'person_id' })
  person_id: string;

  @Expose()
  created_at: Date | null;

  @Expose()
  updatedAt: Date | null;

  @Expose()
  deletedAt?: Date | null;

  @Expose()
  @Type(() => PersonResponseDto)
  person?: PersonResponseDto;
}
