import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaccinesService } from './vaccines.service';
import { VaccinesController } from './vaccines.controller';
import { Vaccine } from './entities/vaccine.entity';
import { SpeciesVaccinationPlan } from '../species-vaccination-plans/entities/species-vaccination-plan.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Vaccine, SpeciesVaccinationPlan])],
    controllers: [VaccinesController],
    providers: [VaccinesService],
    exports: [VaccinesService],
})
export class VaccinesModule {}