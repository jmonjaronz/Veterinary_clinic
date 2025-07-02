import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalizationsService } from './hospitalizations.service';
import { HospitalizationsController } from './hospitalizations.controller';
import { Hospitalization } from './entities/hospitalization.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Hospitalization, Pet, Person])],
    controllers: [HospitalizationsController],
    providers: [HospitalizationsService],
    exports: [HospitalizationsService],
})
export class HospitalizationsModule {}