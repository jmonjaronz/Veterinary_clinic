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
import { ClientsModule } from '../clients/clients.module';

@Module({
    imports: [TypeOrmModule.forFeature([Pet, Person, Species, PetImage ]), ClientsModule],
    controllers: [PetsController, PetImageController],
    providers: [PetsService, PetImageService],
    exports: [PetsService, PetImageService],
})
export class PetsModule {}