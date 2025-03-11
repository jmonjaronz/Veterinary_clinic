import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { Pet } from './entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Species } from '../species/entities/species.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Pet, Person, Species])],
    controllers: [PetsController],
    providers: [PetsService],
    exports: [PetsService],
})
export class PetsModule {}