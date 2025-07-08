import { Expose, Type } from 'class-transformer';
import { AppointmentResponseDto } from 'src/features/appointments/dto/appointment-response.dto';
import { PersonResponseDto } from 'src/features/persons/dto/person-response.dto';
import { PetResponseDto } from 'src/features/pets/dto/pet-response-expose.dto';

export class MedicalRecordResponseDto {
  @Expose() id: number;

  @Expose() pet_id: number;

  @Expose()
  @Type(() => PetResponseDto)
  pet: PetResponseDto;

  @Expose() appointment_id: number;

  @Expose()
  @Type(() => AppointmentResponseDto)
  appointment: AppointmentResponseDto;

  @Expose() veterinarian_id: number;

  @Expose()
  @Type(() => PersonResponseDto)
  veterinarian: PersonResponseDto;

  @Expose() diagnosis: string;
  @Expose() type: string;
  @Expose() prescriptions: string;
  @Expose() notes: string;
  @Expose() appointment_date: string;

  @Expose() created_at: Date;
  @Expose() updatedAt: Date;
  @Expose() deletedAt: Date | null;
}
