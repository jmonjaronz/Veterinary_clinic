import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecord } from './entities/medical-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Hospitalization } from '../hospitalizations/entities/hospitalization.entity';
import { VaccinationRecord } from '../vaccination-plans/entities/vaccination-record.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        MedicalRecord, 
        Pet, 
        Appointment,
        Treatment,
        Hospitalization,
        VaccinationRecord,
        Veterinarian
    ])],
    controllers: [MedicalRecordsController],
    providers: [MedicalRecordsService],
    exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}