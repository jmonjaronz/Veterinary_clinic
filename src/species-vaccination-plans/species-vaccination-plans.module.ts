import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeciesVaccinationPlansService } from './species-vaccination-plans.service';
import { SpeciesVaccinationPlansController } from './species-vaccination-plans.controller';
import { SpeciesVaccinationPlan } from './entities/species-vaccination-plan.entity';
import { Species } from '../species/entities/species.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SpeciesVaccinationPlan, Species])],
    controllers: [SpeciesVaccinationPlansController],
    providers: [SpeciesVaccinationPlansService],
    exports: [SpeciesVaccinationPlansService],
})
export class SpeciesVaccinationPlansModule {}