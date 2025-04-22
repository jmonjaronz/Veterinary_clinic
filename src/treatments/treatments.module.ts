import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentsService } from './treatments.service';
import { TreatmentsController } from './treatments.controller';
import { Treatment } from './entities/treatment.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Treatment, MedicalRecord])],
    controllers: [TreatmentsController],
    providers: [TreatmentsService],
    exports: [TreatmentsService],
})
export class TreatmentsModule {}