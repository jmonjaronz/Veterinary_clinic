import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { OpinionController } from './opinion-medical-record.controller';
import { OpinionMedicalRecord } from './entities/opinion-medical-record.entity';
import { OpinionService } from './opinion-medical-record.service';
import { ClientsModule } from '../clients/clients.module';


@Module({
  imports: [TypeOrmModule.forFeature([OpinionMedicalRecord, MedicalRecord]), ClientsModule],
  controllers: [OpinionController],
  providers: [OpinionService],
  exports: [OpinionService],
})
export class OpinionModule {}
