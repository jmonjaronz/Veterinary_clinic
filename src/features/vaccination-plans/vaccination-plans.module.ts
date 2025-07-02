import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaccinationPlansService } from './vaccination-plans.service';
import { VaccinationPlansController } from './vaccination-plans.controller';
import { VaccinationRecordsController } from './vaccination-records.controller';
import { VaccinationPlan } from './entities/vaccination-plan.entity';
import { VaccinationRecord } from './entities/vaccination-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { SpeciesVaccinationPlan } from '../species-vaccination-plans/entities/species-vaccination-plan.entity';
import { Vaccine } from '../vaccines/entities/vaccine.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        VaccinationPlan, 
        VaccinationRecord,
        Pet, 
        SpeciesVaccinationPlan,
        Vaccine
    ])],
    controllers: [VaccinationPlansController, VaccinationRecordsController],
    providers: [VaccinationPlansService],
    exports: [VaccinationPlansService],
})
export class VaccinationPlansModule {}