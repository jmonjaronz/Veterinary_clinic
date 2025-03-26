import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpeciesVaccinationPlan } from './entities/species-vaccination-plan.entity';
import { Species } from '../species/entities/species.entity';
import { CreateSpeciesVaccinationPlanDto } from './dto/create-species-vaccination-plan.dto';
import { UpdateSpeciesVaccinationPlanDto } from './dto/update-species-vaccination-plan.dto';
import { SpeciesVaccinationPlanFilterDto } from './dto/species-vaccination-plan-filter.dto';

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

    async findAll(filterDto?: SpeciesVaccinationPlanFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new SpeciesVaccinationPlanFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.speciesVaccinationPlanRepository
            .createQueryBuilder('plan')
            .leftJoinAndSelect('plan.species', 'species');
            
        // Aplicar filtros
        if (filters.species_id) {
            queryBuilder.andWhere('plan.species_id = :species_id', { species_id: filters.species_id });
        }
        
        if (filters.vaccine) {
            queryBuilder.andWhere('plan.vaccine LIKE :vaccine', { vaccine: `%${filters.vaccine}%` });
        }
        
        // Filtros de rango para edad recomendada
        if (filters.recommended_age_min !== undefined && filters.recommended_age_max !== undefined) {
            queryBuilder.andWhere('plan.recommended_age BETWEEN :min AND :max', {
                min: filters.recommended_age_min,
                max: filters.recommended_age_max
            });
        } else if (filters.recommended_age_min !== undefined) {
            queryBuilder.andWhere('plan.recommended_age >= :min', { min: filters.recommended_age_min });
        } else if (filters.recommended_age_max !== undefined) {
            queryBuilder.andWhere('plan.recommended_age <= :max', { max: filters.recommended_age_max });
        }
        
        // Filtro por nombre de especie (relación)
        if (filters.species_name) {
            queryBuilder.andWhere('species.name LIKE :species_name', { species_name: `%${filters.species_name}%` });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('plan.id', 'DESC')
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

    async findBySpecies(speciesId: number, filterDto?: SpeciesVaccinationPlanFilterDto): Promise<any> {
        // Verificar si la especie existe
        const species = await this.speciesRepository.findOne({ where: { id: speciesId } });
        if (!species) {
            throw new NotFoundException(`Especie con ID ${speciesId} no encontrada`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? new SpeciesVaccinationPlanFilterDto() : new SpeciesVaccinationPlanFilterDto();
        
        // Establecer el ID de la especie en los filtros
        filters.species_id = speciesId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
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