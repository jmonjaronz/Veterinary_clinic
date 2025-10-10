
import { TreatmentResponseDto } from 'src/features/treatments/dto/treatments-response.dto';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Hospitalization } from '../../hospitalizations/entities/hospitalization.entity';
import { VaccinationRecord } from '../../vaccination-plans/entities/vaccination-record.entity';
import { MedicalRecordResponseDto } from './medical-record-response.dto';

export class PetCompleteHistoryDto {
  medical_records: MedicalRecordResponseDto[];
  appointments: Appointment[];
  hospitalizations: Hospitalization[];
  treatments: TreatmentResponseDto[];
  vaccinations: VaccinationRecord[];

  pet_info: {
    id: number;
    name: string;
    species: string;
    breed?: string;
    age?: number;
    owner_name: string;
  };

  timeline: Array<{
    id: string;
    type:
      | 'medical_record'
      | 'appointment'
      | 'hospitalization'
      | 'treatment'
      | 'vaccination'
      | 'opinion'; // ✅ nuevo tipo
    date: Date;
    description: string;
    veterinarian?: string;
    status?: string;
  }>;
}
