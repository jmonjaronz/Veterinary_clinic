import { MedicalRecord } from '../entities/medical-record.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Hospitalization } from '../../hospitalizations/entities/hospitalization.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { VaccinationRecord } from '../../vaccination-plans/entities/vaccination-record.entity';

export class PetCompleteHistoryDto {
    medical_records: MedicalRecord[];
    appointments: Appointment[];
    hospitalizations: Hospitalization[];
    treatments: Treatment[];
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
        type: 'medical_record' | 'appointment' | 'hospitalization' | 'treatment' | 'vaccination';
        date: Date;
        description: string;
        veterinarian?: string;
        status?: string;
    }>;
}