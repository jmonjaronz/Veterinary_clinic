import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Species } from './entities/species.entity';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';

@Injectable()
export class SpeciesService {
    constructor(
        @InjectRepository(Species)
        private readonly speciesRepository: Repository<Species>,
    ) {}

    async create(createSpeciesDto: CreateSpeciesDto): Promise<Species> {
        // Verificar si ya existe una especie con ese nombre
        const existingSpecies = await this.speciesRepository.findOne({
        where: { name: createSpeciesDto.name }
        });

        if (existingSpecies) {
        throw new ConflictException(`Ya existe una especie con el nombre ${createSpeciesDto.name}`);
        }

        const species = this.speciesRepository.create(createSpeciesDto);
        return this.speciesRepository.save(species);
    }

    async findAll(): Promise<Species[]> {
        return this.speciesRepository.find();
    }

    async findOne(id: number): Promise<Species> {
        const species = await this.speciesRepository.findOne({ where: { id } });

        if (!species) {
        throw new NotFoundException(`Especie con ID ${id} no encontrada`);
        }

        return species;
    }

    async update(id: number, updateSpeciesDto: UpdateSpeciesDto): Promise<Species> {
        const species = await this.findOne(id);

        // Verificar si ya existe otra especie con ese nombre
        if (updateSpeciesDto.name && updateSpeciesDto.name !== species.name) {
        const existingSpecies = await this.speciesRepository.findOne({
            where: { name: updateSpeciesDto.name }
        });

        if (existingSpecies && existingSpecies.id !== id) {
            throw new ConflictException(`Ya existe una especie con el nombre ${updateSpeciesDto.name}`);
        }
        }

        // Actualizar los campos
        Object.assign(species, updateSpeciesDto);
        
        return this.speciesRepository.save(species);
    }

    async remove(id: number): Promise<void> {
        const result = await this.speciesRepository.delete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Especie con ID ${id} no encontrada`);
        }
    }
}