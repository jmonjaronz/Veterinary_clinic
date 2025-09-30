import { Expose, Type } from 'class-transformer';
import { PersonFilterDto } from 'src/features/persons/dto/person-filter.dto';
import { PetResponseDto } from 'src/features/pets/dto/pet-response.dto';
import { UserResponseDto } from 'src/features/users/dto/user-response.dto';

export class AppointmentResponseDto {
  @Expose() id: number;
  @Expose() correlative: string;
  @Expose() pet_id: number;
  @Type(() => PetResponseDto)
  @Expose()
  pet: PetResponseDto;

  @Expose() veterinarian_id: number;
  @Type(() => PersonFilterDto)
  @Expose()
  veterinarian: PersonFilterDto;

  @Expose() appointment_type: string;

  @Expose() date: Date;

  @Expose() status: string;

  @Expose() document: string;

  @Expose() user_id: number;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose() created_at: Date;
  @Expose() updatedAt: Date;
  @Expose() deletedAt: Date | null;
}
