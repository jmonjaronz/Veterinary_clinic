import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecord } from './entities/medical-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Hospitalization } from '../hospitalizations/entities/hospitalization.entity';
import { VaccinationRecord } from '../vaccination-plans/entities/vaccination-record.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        MedicalRecord, 
        Pet, 
        Person, 
        Appointment,
        Treatment,
        Hospitalization,
        VaccinationRecord
    ])],
    controllers: [MedicalRecordsController],
    providers: [MedicalRecordsService],
    exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}