import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Species } from '../species/entities/species.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
    constructor(
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
        @InjectRepository(Species)
        private readonly speciesRepository: Repository<Species>,
    ) {}

    async create(createPetDto: CreatePetDto): Promise<Pet> {
        // Verificar si el propietario existe
        const owner = await this.personRepository.findOne({ 
        where: { id: createPetDto.owner_id } 
        });
        if (!owner) {
            throw new BadRequestException(`Propietario con ID ${createPetDto.owner_id} no encontrado`);
        }

        // Verificar si la especie existe
        const species = await this.speciesRepository.findOne({ 
        where: { id: createPetDto.species_id } 
        });
        if (!species) {
            throw new BadRequestException(`Especie con ID ${createPetDto.species_id} no encontrada`);
        }

        // Crear la mascota
        const pet = this.petRepository.create(createPetDto);
        return this.petRepository.save(pet);
    }

    async findAll(): Promise<Pet[]> {
            return this.petRepository.find({
            relations: ['owner', 'species'],
        });
    }

    async findOne(id: number): Promise<Pet> {
        const pet = await this.petRepository.findOne({
            where: { id },
            relations: ['owner', 'species', 'images'], // Añade 'images' a las relaciones
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }
        
        return pet;
    }      

    async findByOwner(ownerId: number): Promise<Pet[]> {
        return this.petRepository.find({
            where: { owner_id: ownerId },
            relations: ['owner', 'species', 'images'],  // Añadimos 'images' a las relaciones
        });
    }
    
    async findBySpecies(speciesId: number): Promise<Pet[]> {
        return this.petRepository.find({
            where: { species_id: speciesId },
            relations: ['owner', 'species', 'images'],  // Añadimos 'images' a las relaciones
        });
    }

    async update(id: number, updatePetDto: UpdatePetDto): Promise<Pet> {
        const pet = await this.findOne(id);

        // Verificar si el propietario existe si se intenta cambiar
        if (updatePetDto.owner_id && updatePetDto.owner_id !== pet.owner_id) {
        const owner = await this.personRepository.findOne({ 
            where: { id: updatePetDto.owner_id } 
        });
        if (!owner) {
            throw new BadRequestException(`Propietario con ID ${updatePetDto.owner_id} no encontrado`);
        }
        }

        // Verificar si la especie existe si se intenta cambiar
        if (updatePetDto.species_id && updatePetDto.species_id !== pet.species_id) {
        const species = await this.speciesRepository.findOne({ 
            where: { id: updatePetDto.species_id } 
        });
        if (!species) {
            throw new BadRequestException(`Especie con ID ${updatePetDto.species_id} no encontrada`);
        }
        }

        // Actualizar campos
        Object.assign(pet, updatePetDto);
        
        return this.petRepository.save(pet);
    }

    async remove(id: number): Promise<void> {
        const result = await this.petRepository.delete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }
    }
}