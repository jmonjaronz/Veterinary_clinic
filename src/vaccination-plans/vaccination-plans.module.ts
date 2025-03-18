import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaccinationPlansService } from './vaccination-plans.service';
import { VaccinationPlansController } from './vaccination-plans.controller';
import { VaccinationPlan } from './entities/vaccination-plan.entity';
import { Pet } from '../pets/entities/pet.entity';
import { SpeciesVaccinationPlan } from '../species-vaccination-plans/entities/species-vaccination-plan.entity';

@Module({
    imports: [TypeOrmModule.forFeature([VaccinationPlan, Pet, SpeciesVaccinationPlan])],
    controllers: [VaccinationPlansController],
    providers: [VaccinationPlansService],
    exports: [VaccinationPlansService],
})
export class VaccinationPlansModule {}