import { Appointment } from '../../appointments/entities/appointment.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { Person } from '../../persons/entities/person.entity';

export class SurgicalConsentResponseDto {
    id: number;
    appointment_id: number;
    appointment?: Appointment;
    pet_id: number;
    pet?: Pet;
    owner_id: number;
    owner?: Person;
    veterinarian_id: number;
    veterinarian?: Person;
    procedure_type: string;
    comments?: string;
    signed_document?: string;
    signedDocumentUrl?: string | null; // URL para acceso al documento firmado
    status: string;
    scheduled_date: Date;
    created_at: Date;
}