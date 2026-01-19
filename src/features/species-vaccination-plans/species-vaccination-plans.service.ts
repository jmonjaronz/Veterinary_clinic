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
        const { species_id, name, description } = createSpeciesVaccinationPlanDto;

        // Verificar si la especie existe
        const species = await this.speciesRepository.findOne({ where: { id: species_id } });
        if (!species) {
            throw new NotFoundException(`Especie con ID ${species_id} no encontrada`);
        }

        // Verificar si ya existe un plan con el mismo nombre para esta especie
        const existingPlan = await this.speciesVaccinationPlanRepository.findOne({
            where: { species_id, name }
        });

        if (existingPlan) {
            throw new ConflictException(`Ya existe un plan de vacunación para ${species.name} con el nombre ${name}`);
        }

        // Crear el plan de vacunación
        const speciesVaccinationPlan = this.speciesVaccinationPlanRepository.create({
            species_id,
            name,
            description,
        });

        return this.speciesVaccinationPlanRepository.save(speciesVaccinationPlan);
    }

    async findAll(filterDto?: SpeciesVaccinationPlanFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new SpeciesVaccinationPlanFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.speciesVaccinationPlanRepository
            .createQueryBuilder('plan')
            .leftJoinAndSelect('plan.species', 'species')
            .leftJoinAndSelect('plan.vaccines', 'vaccines');
            
        // Aplicar filtros
        if (filters.species_id) {
            queryBuilder.andWhere('plan.species_id = :species_id', { species_id: filters.species_id });
        }
        
        if (filters.name) {
            queryBuilder.andWhere('plan.name ILIKE :name', { name: `%${filters.name}%` });
        }
        
        if (filters.description) {
            queryBuilder.andWhere('plan.description ILIKE :description', { description: `%${filters.description}%` });
        }
        
        // Filtro por nombre de especie (relación)
        if (filters.species_name) {
            queryBuilder.andWhere('species.name ILIKE :species_name', { species_name: `%${filters.species_name}%` });
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
            relations: ['species', 'vaccines'],
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
        const filters = filterDto ? { ...filterDto } : new SpeciesVaccinationPlanFilterDto();
        
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

        // Si se intenta cambiar el nombre, verificar que no exista otro igual para la misma especie
        if (updateSpeciesVaccinationPlanDto.name && 
            updateSpeciesVaccinationPlanDto.name !== speciesVaccinationPlan.name) {
            const speciesId = updateSpeciesVaccinationPlanDto.species_id || speciesVaccinationPlan.species_id;
            
            const existingPlan = await this.speciesVaccinationPlanRepository.findOne({
                where: { 
                    species_id: speciesId, 
                    name: updateSpeciesVaccinationPlanDto.name 
                }
            });

            if (existingPlan && existingPlan.id !== id) {
                throw new ConflictException(`Ya existe un plan de vacunación para esta especie con el nombre ${updateSpeciesVaccinationPlanDto.name}`);
            }
        }

        // Actualizar los campos
        Object.assign(speciesVaccinationPlan, updateSpeciesVaccinationPlanDto);
        
        return this.speciesVaccinationPlanRepository.save(speciesVaccinationPlan);
    }

    async remove(id: number): Promise<void> {
        const result = await this.speciesVaccinationPlanRepository.softDelete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Plan de vacunación con ID ${id} no encontrado`);
        }
    }
}