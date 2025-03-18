import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaccinationPlan } from './entities/vaccination-plan.entity';
import { Pet } from '../pets/entities/pet.entity';
import { SpeciesVaccinationPlan } from '../species-vaccination-plans/entities/species-vaccination-plan.entity';
import { CreateVaccinationPlanDto } from './dto/create-vaccination-plan.dto';
import { UpdateVaccinationPlanDto } from './dto/update-vaccination-plan.dto';

@Injectable()
export class VaccinationPlansService {
    constructor(
        @InjectRepository(VaccinationPlan)
        private readonly vaccinationPlanRepository: Repository<VaccinationPlan>,
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(SpeciesVaccinationPlan)
        private readonly speciesVaccinationPlanRepository: Repository<SpeciesVaccinationPlan>,
    ) {}

    async create(createVaccinationPlanDto: CreateVaccinationPlanDto): Promise<VaccinationPlan> {
        const { pet_id, species_vaccination_plan_id, scheduled_date } = createVaccinationPlanDto;

        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ 
        where: { id: pet_id },
        relations: ['species'] 
        });
        if (!pet) {
        throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
        }

        // Verificar si el plan de vacunación por especie existe
        const speciesVaccinationPlan = await this.speciesVaccinationPlanRepository.findOne({ 
        where: { id: species_vaccination_plan_id },
        relations: ['species']
        });
        if (!speciesVaccinationPlan) {
        throw new NotFoundException(`Plan de vacunación por especie con ID ${species_vaccination_plan_id} no encontrado`);
        }

        // Verificar que el plan de vacunación por especie corresponda a la especie de la mascota
        if (speciesVaccinationPlan.species_id !== pet.species_id) {
        throw new BadRequestException(`El plan de vacunación seleccionado no corresponde a la especie de la mascota`);
        }

        // Crear el plan de vacunación
        const vaccinationPlan = this.vaccinationPlanRepository.create({
        pet_id,
        species_vaccination_plan_id,
        scheduled_date,
        administered_date: createVaccinationPlanDto.administered_date,
        status: createVaccinationPlanDto.status || 'pendiente',
        });

        return this.vaccinationPlanRepository.save(vaccinationPlan);
    }

    async findAll(): Promise<VaccinationPlan[]> {
        return this.vaccinationPlanRepository.find({
        relations: ['pet', 'pet.owner', 'species_vaccination_plan', 'species_vaccination_plan.species'],
        });
    }

    async findOne(id: number): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.vaccinationPlanRepository.findOne({
        where: { id },
        relations: ['pet', 'pet.owner', 'species_vaccination_plan', 'species_vaccination_plan.species'],
        });

        if (!vaccinationPlan) {
        throw new NotFoundException(`Plan de vacunación con ID ${id} no encontrado`);
        }

        return vaccinationPlan;
    }

    async findByPet(petId: number): Promise<VaccinationPlan[]> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId } });
        if (!pet) {
        throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        return this.vaccinationPlanRepository.find({
        where: { pet_id: petId },
        relations: ['pet', 'pet.owner', 'species_vaccination_plan', 'species_vaccination_plan.species'],
        });
    }

    async findPending(): Promise<VaccinationPlan[]> {
        return this.vaccinationPlanRepository.find({
        where: { status: 'pendiente' },
        relations: ['pet', 'pet.owner', 'species_vaccination_plan', 'species_vaccination_plan.species'],
        });
    }

    async update(id: number, updateVaccinationPlanDto: UpdateVaccinationPlanDto): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.findOne(id);
        
        // Si se intenta cambiar la mascota, verificar que exista
        if (updateVaccinationPlanDto.pet_id && 
            updateVaccinationPlanDto.pet_id !== vaccinationPlan.pet_id) {
        const pet = await this.petRepository.findOne({ 
            where: { id: updateVaccinationPlanDto.pet_id },
            relations: ['species']
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${updateVaccinationPlanDto.pet_id} no encontrada`);
        }

        // Si también se cambia el plan de vacunación por especie, verificar que corresponda a la nueva mascota
        if (updateVaccinationPlanDto.species_vaccination_plan_id) {
            const speciesVaccinationPlan = await this.speciesVaccinationPlanRepository.findOne({ 
            where: { id: updateVaccinationPlanDto.species_vaccination_plan_id } 
            });
            
            if (!speciesVaccinationPlan) {
            throw new NotFoundException(`Plan de vacunación por especie con ID ${updateVaccinationPlanDto.species_vaccination_plan_id} no encontrado`);
            }

            if (speciesVaccinationPlan.species_id !== pet.species_id) {
            throw new BadRequestException(`El plan de vacunación seleccionado no corresponde a la especie de la mascota`);
            }
        }
        } 
        // Si solo se cambia el plan de vacunación por especie, verificar que corresponda a la mascota actual
        else if (updateVaccinationPlanDto.species_vaccination_plan_id && 
                updateVaccinationPlanDto.species_vaccination_plan_id !== vaccinationPlan.species_vaccination_plan_id) {
        const pet = await this.petRepository.findOne({ 
            where: { id: vaccinationPlan.pet_id },
            relations: ['species']
        });
        
        const speciesVaccinationPlan = await this.speciesVaccinationPlanRepository.findOne({ 
            where: { id: updateVaccinationPlanDto.species_vaccination_plan_id } 
        });
        
        if (!speciesVaccinationPlan) {
            throw new NotFoundException(`Plan de vacunación por especie con ID ${updateVaccinationPlanDto.species_vaccination_plan_id} no encontrado`);
        }

        if (speciesVaccinationPlan.species_id !== pet?.species_id) {
            throw new BadRequestException(`El plan de vacunación seleccionado no corresponde a la especie de la mascota`);
        }
        }

        // Si se está completando el plan (cambio de estado a 'completado'), verificar que tenga fecha de administración
        if (updateVaccinationPlanDto.status === 'completado' && 
            !updateVaccinationPlanDto.administered_date && 
            !vaccinationPlan.administered_date) {
        throw new BadRequestException(`Para marcar como completado, debe proporcionar una fecha de administración`);
        }

        // Actualizar los campos
        Object.assign(vaccinationPlan, updateVaccinationPlanDto);
        
        return this.vaccinationPlanRepository.save(vaccinationPlan);
    }

    async complete(id: number, administered_date: Date): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.findOne(id);
        
        if (vaccinationPlan.status === 'completado') {
        throw new BadRequestException(`Este plan de vacunación ya está completado`);
        }

        if (vaccinationPlan.status === 'cancelado') {
        throw new BadRequestException(`No se puede completar un plan de vacunación cancelado`);
        }

        vaccinationPlan.status = 'completado';
        vaccinationPlan.administered_date = administered_date || new Date();
        
        return this.vaccinationPlanRepository.save(vaccinationPlan);
    }

    async cancel(id: number): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.findOne(id);
        
        if (vaccinationPlan.status === 'completado') {
        throw new BadRequestException(`No se puede cancelar un plan de vacunación completado`);
        }

        if (vaccinationPlan.status === 'cancelado') {
        throw new BadRequestException(`Este plan de vacunación ya está cancelado`);
        }

        vaccinationPlan.status = 'cancelado';
        
        return this.vaccinationPlanRepository.save(vaccinationPlan);
    }

    async remove(id: number): Promise<void> {
        const result = await this.vaccinationPlanRepository.delete(id);
        
        if (result.affected === 0) {
        throw new NotFoundException(`Plan de vacunación con ID ${id} no encontrado`);
        }
    }
}