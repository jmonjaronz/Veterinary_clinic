import { Appointment } from '../../appointments/entities/appointment.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { ProcedureType } from '../entities/procedure-type.entity';
import { Veterinarian } from 'src/features/veterinarians/entities/veterinarian.entity';
import { Company } from 'src/features/companies/entities/company.entity';
import { Client } from 'src/features/clients/entities/client.entity';

export class SurgicalConsentResponseDto {
    id: number;
    appointment_id: number;
    appointment?: Appointment;
    pet_id: number;
    pet?: Pet;
    owner_id: number;
    owner?: Client;
    veterinarian_id: number;
    veterinarian?: Veterinarian;
    companyId: number;
    company?: Company;
    procedure_type_id?: number;
    procedureType?: ProcedureType;
    custom_procedure_type?: string;
    comments?: string;
    signed_document?: string;
    signedDocumentUrl?: string | null;
    status: string;
    scheduled_date: Date;
    created_at: Date | null;
    procedureTypeName?: string;
}