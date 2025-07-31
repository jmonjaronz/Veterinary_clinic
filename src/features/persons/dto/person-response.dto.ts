import { Expose, Type } from 'class-transformer';

class PetShortResponseDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() breed: string;
  @Expose() photo: string | null;
  @Expose() description: string | null;
}

export class PersonResponseDto {
  @Expose() id: number;
  @Expose() full_name: string;
  @Expose() email: string | null;
  @Expose() dni: string | null;
  @Expose() phone_number: string | null;
  @Expose() address: string | null;
  @Expose() role: string;

  @Expose()
  @Type(() => PetShortResponseDto)
  pets: PetShortResponseDto[];

  @Expose() created_at: Date | null;
  @Expose() updated_at: Date | null;
  @Expose() deleted_at: Date | null;
}
