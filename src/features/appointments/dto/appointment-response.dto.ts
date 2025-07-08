import { Expose, Type } from 'class-transformer';
import { PersonFilterDto } from 'src/features/persons/dto/person-filter.dto';
import { PetResponseDto } from 'src/features/pets/dto/pet-response.dto';

export class AppointmentResponseDto {
  @Expose() id: number;
 @Expose() correlative: string;
  @Expose() pet_id: number;
  @Type(() => PetResponseDto)
  @Expose() pet: PetResponseDto;

  @Expose() veterinarian_id: number;
  @Type(() => PersonFilterDto)
  @Expose() veterinarian: PersonFilterDto;

  @Expose() appointment_type: string;

  @Expose() date: Date;

  @Expose() status: string;

  @Expose() document: string;

  @Expose() created_at: Date;
  @Expose() updatedAt: Date;
  @Expose() deletedAt: Date | null;
}
