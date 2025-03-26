import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaccinationPlan } from './entities/vaccination-plan.entity';
import { Pet } from '../pets/entities/pet.entity';
import { SpeciesVaccinationPlan } from '../species-vaccination-plans/entities/species-vaccination-plan.entity';
import { CreateVaccinationPlanDto } from './dto/create-vaccination-plan.dto';
import { UpdateVaccinationPlanDto } from './dto/update-vaccination-plan.dto';
import { VaccinationPlanFilterDto } from './dto/vaccination-plan-filter.dto';

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

    async findAll(filterDto?: VaccinationPlanFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new VaccinationPlanFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.vaccinationPlanRepository
            .createQueryBuilder('vp')
            .leftJoinAndSelect('vp.pet', 'pet')
            .leftJoinAndSelect('pet.owner', 'owner')
            .leftJoinAndSelect('vp.species_vaccination_plan', 'svp')
            .leftJoinAndSelect('svp.species', 'species');
            
        // Aplicar filtros de plan de vacunación
        if (filters.pet_id) {
            queryBuilder.andWhere('vp.pet_id = :pet_id', { pet_id: filters.pet_id });
        }
        
        if (filters.species_vaccination_plan_id) {
            queryBuilder.andWhere('vp.species_vaccination_plan_id = :svp_id', { 
                svp_id: filters.species_vaccination_plan_id 
            });
        }
        
        if (filters.status) {
            queryBuilder.andWhere('vp.status = :status', { status: filters.status });
        }
        
        // Filtros de rango para fechas
        if (filters.scheduled_date_start && filters.scheduled_date_end) {
            queryBuilder.andWhere('vp.scheduled_date BETWEEN :start AND :end', {
                start: filters.scheduled_date_start,
                end: filters.scheduled_date_end
            });
        } else if (filters.scheduled_date_start) {
            queryBuilder.andWhere('vp.scheduled_date >= :start', { start: filters.scheduled_date_start });
        } else if (filters.scheduled_date_end) {
            queryBuilder.andWhere('vp.scheduled_date <= :end', { end: filters.scheduled_date_end });
        }
        
        if (filters.administered_date_start && filters.administered_date_end) {
            queryBuilder.andWhere('vp.administered_date BETWEEN :admin_start AND :admin_end', {
                admin_start: filters.administered_date_start,
                admin_end: filters.administered_date_end
            });
        } else if (filters.administered_date_start) {
            queryBuilder.andWhere('vp.administered_date >= :admin_start', { admin_start: filters.administered_date_start });
        } else if (filters.administered_date_end) {
            queryBuilder.andWhere('vp.administered_date <= :admin_end', { admin_end: filters.administered_date_end });
        }
        
        // Filtros para la mascota relacionada
        if (filters.pet_name) {
            queryBuilder.andWhere('pet.name LIKE :pet_name', { pet_name: `%${filters.pet_name}%` });
        }
        
        if (filters.owner_id) {
            queryBuilder.andWhere('pet.owner_id = :owner_id', { owner_id: filters.owner_id });
        }
        
        if (filters.owner_name) {
            queryBuilder.andWhere('owner.full_name LIKE :owner_name', { owner_name: `%${filters.owner_name}%` });
        }
        
        // Filtros para el plan de vacunación por especie
        if (filters.vaccine) {
            queryBuilder.andWhere('svp.vaccine LIKE :vaccine', { vaccine: `%${filters.vaccine}%` });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('vp.scheduled_date', 'ASC')
            .addOrderBy('vp.id', 'DESC')
            .skip(skip)
            .take(filters.per_page);
        
        // Ejecutar la consulta
        const [data, total] = await queryBuilder.getManyAndCount();
        
        // Calcular metadatos de paginación
        const lastPage = Math.ceil(total / filters.per_page);
        
        return {
            data,
            meta: {
                total,
                per_page: filters.per_page,
                current_page: filters.page,
                last_page: lastPage,
                from: skip + 1,
                to: skip + data.length,
            },
            links: {
                first: `?page=1&per_page=${filters.per_page}`,
                last: `?page=${lastPage}&per_page=${filters.per_page}`,
                prev: filters.page > 1 ? `?page=${filters.page - 1}&per_page=${filters.per_page}` : null,
                next: filters.page < lastPage ? `?page=${filters.page + 1}&per_page=${filters.per_page}` : null,
            }
        };
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

    async findByPet(petId: number, filterDto?: VaccinationPlanFilterDto): Promise<any> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId } });
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new VaccinationPlanFilterDto();
        
        // Establecer el ID de la mascota en los filtros
        filters.pet_id = petId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async findPending(filterDto?: VaccinationPlanFilterDto): Promise<any> {
        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new VaccinationPlanFilterDto();
        
        // Establecer el estado en los filtros
        filters.status = 'pendiente';
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
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