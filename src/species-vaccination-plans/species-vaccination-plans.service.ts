import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpeciesVaccinationPlan } from './entities/species-vaccination-plan.entity';
import { Species } from '../species/entities/species.entity';
import { CreateSpeciesVaccinationPlanDto } from './dto/create-species-vaccination-plan.dto';
import { UpdateSpeciesVaccinationPlanDto } from './dto/update-species-vaccination-plan.dto';

@Injectable()
export class SpeciesVaccinationPlansService {
    constructor(
        @InjectRepository(SpeciesVaccinationPlan)
        private readonly speciesVaccinationPlanRepository: Repository<SpeciesVaccinationPlan>,
        @InjectRepository(Species)
        private readonly speciesRepository: Repository<Species>,
    ) {}

    async create(createSpeciesVaccinationPlanDto: CreateSpeciesVaccinationPlanDto): Promise<SpeciesVaccinationPlan> {
        const { species_id, vaccine, recommended_age } = createSpeciesVaccinationPlanDto;

        // Verificar si la especie existe
        const species = await this.speciesRepository.findOne({ where: { id: species_id } });
        if (!species) {
        throw new NotFoundException(`Especie con ID ${species_id} no encontrada`);
        }

        // Verificar si ya existe un plan con la misma vacuna para esta especie
        const existingPlan = await this.speciesVaccinationPlanRepository.findOne({
        where: { species_id, vaccine }
        });

        if (existingPlan) {
        throw new ConflictException(`Ya existe un plan de vacunación para ${species.name} con la vacuna ${vaccine}`);
        }

        // Crear el plan de vacunación
        const speciesVaccinationPlan = this.speciesVaccinationPlanRepository.create({
        species_id,
        vaccine,
        recommended_age,
        });

        return this.speciesVaccinationPlanRepository.save(speciesVaccinationPlan);
    }

    async findAll(): Promise<SpeciesVaccinationPlan[]> {
        return this.speciesVaccinationPlanRepository.find({
        relations: ['species'],
        });
    }

    async findOne(id: number): Promise<SpeciesVaccinationPlan> {
        const speciesVaccinationPlan = await this.speciesVaccinationPlanRepository.findOne({
        where: { id },
        relations: ['species'],
        });

        if (!speciesVaccinationPlan) {
        throw new NotFoundException(`Plan de vacunación con ID ${id} no encontrado`);
        }

        return speciesVaccinationPlan;
    }

    async findBySpecies(speciesId: number): Promise<SpeciesVaccinationPlan[]> {
        // Verificar si la especie existe
        const species = await this.speciesRepository.findOne({ where: { id: speciesId } });
        if (!species) {
        throw new NotFoundException(`Especie con ID ${speciesId} no encontrada`);
        }

        return this.speciesVaccinationPlanRepository.find({
        where: { species_id: speciesId },
        relations: ['species'],
        });
    }

    async update(id: number, updateSpeciesVaccinationPlanDto: UpdateSpeciesVaccinationPlanDto): Promise<SpeciesVaccinationPlan> {
        const speciesVaccinationPlan = await this.findOne(id);
        
        // Si se intenta cambiar la especie, verificar que exista
        if (updateSpeciesVaccinationPlanDto.species_id && 
            updateSpeciesVaccinationPlanDto.species_id !== speciesVaccinationPlan.species_id) {
        const species = await this.speciesRepository.findOne({ 
            where: { id: updateSpeciesVaccinationPlanDto.species_id } 
        });
        
        if (!species) {
            throw new NotFoundException(`Especie con ID ${updateSpeciesVaccinationPlanDto.species_id} no encontrada`);
        }
        }

        // Si se intenta cambiar la vacuna, verificar que no exista otra igual para la misma especie
        if (updateSpeciesVaccinationPlanDto.vaccine && 
            updateSpeciesVaccinationPlanDto.vaccine !== speciesVaccinationPlan.vaccine) {
        const speciesId = updateSpeciesVaccinationPlanDto.species_id || speciesVaccinationPlan.species_id;
        
        const existingPlan = await this.speciesVaccinationPlanRepository.findOne({
            where: { 
            species_id: speciesId, 
            vaccine: updateSpeciesVaccinationPlanDto.vaccine 
            }
        });

        if (existingPlan && existingPlan.id !== id) {
            throw new ConflictException(`Ya existe un plan de vacunación para esta especie con la vacuna ${updateSpeciesVaccinationPlanDto.vaccine}`);
        }
        }

        // Actualizar los campos
        Object.assign(speciesVaccinationPlan, updateSpeciesVaccinationPlanDto);
        
        return this.speciesVaccinationPlanRepository.save(speciesVaccinationPlan);
    }

    async remove(id: number): Promise<void> {
        const result = await this.speciesVaccinationPlanRepository.delete(id);
        
        if (result.affected === 0) {
        throw new NotFoundException(`Plan de vacunación con ID ${id} no encontrado`);
        }
    }
}