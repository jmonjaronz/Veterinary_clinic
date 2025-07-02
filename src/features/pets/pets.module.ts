import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { Pet } from './entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Species } from '../species/entities/species.entity';
import { PetImage } from './entities/pet-image.entity';
import { PetImageService } from './pet-image.service';
import { PetImageController } from './pet-image.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Pet, Person, Species, PetImage])],
    controllers: [PetsController, PetImageController],
    providers: [PetsService, PetImageService],
    exports: [PetsService, PetImageService],
})
export class PetsModule {}