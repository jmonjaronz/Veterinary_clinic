import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccine } from './entities/vaccine.entity';
import { SpeciesVaccinationPlan } from '../species-vaccination-plans/entities/species-vaccination-plan.entity';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { VaccineFilterDto } from './dto/vaccine-filter.dto';

@Injectable()
export class VaccinesService {
    constructor(
        @InjectRepository(Vaccine)
        private readonly vaccineRepository: Repository<Vaccine>,
        @InjectRepository(SpeciesVaccinationPlan)
        private readonly speciesVaccinationPlanRepository: Repository<SpeciesVaccinationPlan>,
    ) {}

    async create(createVaccineDto: CreateVaccineDto, companyId: number): Promise<Vaccine> {
        const { species_vaccination_plan_id, name, application_age, validity, is_mandatory } = createVaccineDto;

        // Verificar si el plan de vacunación por especie existe
        const plan = await this.speciesVaccinationPlanRepository.findOne({ 
            where: { id: species_vaccination_plan_id, companyId },
            relations: ['vaccines'] 
        });
        
        if (!plan) {
            throw new NotFoundException(`Plan de vacunación con ID ${species_vaccination_plan_id} no encontrado`);
        }

        // Verificar si ya existe una vacuna con el mismo nombre en este plan
        const existingVaccine = plan.vaccines.find(v => v.name.toLowerCase() === name.toLowerCase());
        if (existingVaccine) {
            throw new ConflictException(`Ya existe una vacuna con el nombre '${name}' en este plan de vacunación`);
        }

        // Crear la vacuna
        const vaccine = this.vaccineRepository.create({
            species_vaccination_plan_id,
            name,
            application_age,
            validity,
            is_mandatory: is_mandatory !== undefined ? is_mandatory : false
        });

        return this.vaccineRepository.save(vaccine);
    }

    async findAll(companyId: number, filterDto?: VaccineFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new VaccineFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.vaccineRepository
            .createQueryBuilder('vaccine')
            .leftJoinAndSelect('vaccine.species_vaccination_plan', 'plan')
            .leftJoinAndSelect('plan.species', 'species')
            .where('plan.companyId = :companyId', { companyId });
            
        // Aplicar filtros
        if (filters.species_vaccination_plan_id) {
            queryBuilder.andWhere('vaccine.species_vaccination_plan_id = :plan_id', { 
                plan_id: filters.species_vaccination_plan_id 
            });
        }
        
        if (filters.name) {
            queryBuilder.andWhere('vaccine.name ILIKE :name', { name: `%${filters.name}%` });
        }
        
        // Filtros de rango para edad de aplicación
        if (filters.application_age_min !== undefined && filters.application_age_max !== undefined) {
            queryBuilder.andWhere('vaccine.application_age BETWEEN :min AND :max', {
                min: filters.application_age_min,
                max: filters.application_age_max
            });
        } else if (filters.application_age_min !== undefined) {
            queryBuilder.andWhere('vaccine.application_age >= :min', { min: filters.application_age_min });
        } else if (filters.application_age_max !== undefined) {
            queryBuilder.andWhere('vaccine.application_age <= :max', { max: filters.application_age_max });
        }
        
        // Filtros de rango para vigencia
        if (filters.validity_min !== undefined && filters.validity_max !== undefined) {
            queryBuilder.andWhere('vaccine.validity BETWEEN :vmin AND :vmax', {
                vmin: filters.validity_min,
                vmax: filters.validity_max
            });
        } else if (filters.validity_min !== undefined) {
            queryBuilder.andWhere('vaccine.validity >= :vmin', { vmin: filters.validity_min });
        } else if (filters.validity_max !== undefined) {
            queryBuilder.andWhere('vaccine.validity <= :vmax', { vmax: filters.validity_max });
        }
        
        // Filtro por obligatoriedad
        if (filters.is_mandatory !== undefined) {
            queryBuilder.andWhere('vaccine.is_mandatory = :mandatory', { mandatory: filters.is_mandatory });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('vaccine.application_age', 'ASC')
            .addOrderBy('vaccine.id', 'DESC')
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

    async findOne(id: number, companyId: number): Promise<Vaccine> {
        const vaccine = await this.vaccineRepository.findOne({
            where: { id, species_vaccination_plan: { companyId } },
            relations: ['species_vaccination_plan', 'species_vaccination_plan.species'],
        });

        if (!vaccine) {
            throw new NotFoundException(`Vacuna con ID ${id} no encontrada`);
        }

        return vaccine;
    }

    async findByPlan(planId: number, companyId: number, filterDto?: VaccineFilterDto): Promise<any> {
        // Verificar si el plan de vacunación existe
        const plan = await this.speciesVaccinationPlanRepository.findOne({ where: { id: planId, companyId } });
        if (!plan) {
            throw new NotFoundException(`Plan de vacunación con ID ${planId} no encontrado`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new VaccineFilterDto();
        
        // Establecer el ID del plan en los filtros
        filters.species_vaccination_plan_id = planId;
        
        // Usar el método findAll con los filtros
        return this.findAll(companyId, filters);
    }

    async update(id: number, updateVaccineDto: UpdateVaccineDto, companyId: number): Promise<Vaccine> {
        const vaccine = await this.findOne(id, companyId);
        
        // Si se intenta cambiar el plan, verificar que exista
        if (updateVaccineDto.species_vaccination_plan_id && 
            updateVaccineDto.species_vaccination_plan_id !== vaccine.species_vaccination_plan_id) {
            const plan = await this.speciesVaccinationPlanRepository.findOne({ 
                where: { id: updateVaccineDto.species_vaccination_plan_id, companyId },
                relations: ['vaccines']
            });
            
            if (!plan) {
                throw new NotFoundException(`Plan de vacunación con ID ${updateVaccineDto.species_vaccination_plan_id} no encontrado`);
            }
            
            // Verificar si ya existe una vacuna con el mismo nombre en el nuevo plan
            const name = updateVaccineDto.name || vaccine.name;
            const existingVaccine = plan.vaccines.find(v => v.name.toLowerCase() === name.toLowerCase());
            
            if (existingVaccine && existingVaccine.id !== id) {
                throw new ConflictException(`Ya existe una vacuna con el nombre '${name}' en este plan de vacunación`);
            }
        } 
        // Si solo se cambia el nombre, verificar que no exista otra vacuna con ese nombre en el mismo plan
        else if (updateVaccineDto.name && updateVaccineDto.name !== vaccine.name) {
            const plan = await this.speciesVaccinationPlanRepository.findOne({ 
                where: { id: vaccine.species_vaccination_plan_id, companyId },
                relations: ['vaccines']
            });
            
            if (plan && plan.vaccines) { // Verificamos que plan y plan.vaccines no sean nulos
                const existingVaccine = plan.vaccines.find(v => 
                    v.name.toLowerCase() === updateVaccineDto.name?.toLowerCase() && v.id !== id
                );
                
                if (existingVaccine) {
                    throw new ConflictException(`Ya existe una vacuna con el nombre '${updateVaccineDto.name}' en este plan de vacunación`);
                }
            }
        }

        // Actualizar los campos
        await this.vaccineRepository.update(id, updateVaccineDto);
        return this.findOne(id, companyId);
    }

    async remove(id: number, companyId: number): Promise<void> {
        const vaccine = await this.findOne(id, companyId);
        if (!vaccine) {
            throw new NotFoundException(`Vacuna con ID ${id} no encontrada`);
        }
        await this.vaccineRepository.softDelete(id);
    }
}