import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecord } from './entities/medical-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MedicalRecord, Pet, Person, Appointment])],
    controllers: [MedicalRecordsController],
    providers: [MedicalRecordsService],
    exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}