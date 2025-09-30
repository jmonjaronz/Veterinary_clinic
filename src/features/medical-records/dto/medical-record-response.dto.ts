import { Expose, Type } from 'class-transformer';
import { AppointmentResponseDto } from 'src/features/appointments/dto/appointment-response.dto';
import { OpinionResponseDto } from 'src/features/opinion-medical-record/dto/opinion-medical-records-response.dto';
import { OpinionMedicalRecord } from 'src/features/opinion-medical-record/entities/opinion-medical-record.entity';
import { PersonResponseDto } from 'src/features/persons/dto/person-response.dto';
import { PetResponseDto } from 'src/features/pets/dto/pet-response-expose.dto';
import { TreatmentResponseDto } from 'src/features/treatments/dto/treatments-response.dto';
import { UserResponseDto } from 'src/features/users/dto/user-response.dto';

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

  @Expose()
  @Type(() => TreatmentResponseDto)
  treatments: TreatmentResponseDto[];

  @Expose() diagnosis: string;
  @Expose() type: string;

  @Expose() lote: string;
  @Expose() care_type: string;
  @Expose() date_next_application: Date;
  @Expose() note_next_application: string;

  @Expose() appointment_date: Date;

  // CAMPOS CLÍNICOS
  @Expose() anamnesis: string;
  @Expose() weight: string;
  @Expose() temperature: string;
  @Expose() heart_rate: string;
  @Expose() breathing_frequency: string;
  @Expose() capillary_refill_time: string;
  @Expose() mucous: string;

  // BOOLEANOS
  @Expose() swallow_reflex: boolean;
  @Expose() cough_reflex: boolean;
  @Expose() palmo_percussion: boolean;

  // OBSERVACIONES
  @Expose() lymph_nodes: string;
  @Expose() consciousness_state: string;
  @Expose() nutritional_state: string;
  @Expose() hydration_state: string;
  @Expose() pain_level: string;
  @Expose() itch_intensity: string;
  @Expose() clinical_signs: string;
  @Expose() blood_pressure: string;
  @Expose() presumptive_diagnosis: string;
  @Expose() recommended_tests: string;
  @Expose() definitive_diagnosis: string;
  @Expose() diet: string;

  @Expose() user_id: number;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  @Type(() => OpinionResponseDto)
  opinions: OpinionResponseDto[];

  // FECHAS
  @Expose() created_at: Date;
  @Expose() updatedAt: Date;
  @Expose() deletedAt: Date | null;
}
