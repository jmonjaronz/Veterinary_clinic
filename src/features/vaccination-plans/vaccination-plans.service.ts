import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaccinationPlan } from './entities/vaccination-plan.entity';
import { VaccinationRecord } from './entities/vaccination-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { SpeciesVaccinationPlan } from '../species-vaccination-plans/entities/species-vaccination-plan.entity';
import { Vaccine } from '../vaccines/entities/vaccine.entity';
import { CreateVaccinationPlanDto } from './dto/create-vaccination-plan.dto';
import { UpdateVaccinationPlanDto } from './dto/update-vaccination-plan.dto';
import { VaccinationPlanFilterDto } from './dto/vaccination-plan-filter.dto';
import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';
import { UpdateVaccinationRecordDto } from './dto/update-vaccination-record.dto';
import { VaccinationRecordFilterDto } from './dto/vaccination-record-filter.dto';

@Injectable()
export class VaccinationPlansService {
    constructor(
        @InjectRepository(VaccinationPlan)
        private readonly vaccinationPlanRepository: Repository<VaccinationPlan>,
        @InjectRepository(VaccinationRecord)
        private readonly vaccinationRecordRepository: Repository<VaccinationRecord>,
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(SpeciesVaccinationPlan)
        private readonly speciesVaccinationPlanRepository: Repository<SpeciesVaccinationPlan>,
        @InjectRepository(Vaccine)
        private readonly vaccineRepository: Repository<Vaccine>,
    ) {}

    async create(createVaccinationPlanDto: CreateVaccinationPlanDto, companyId: number): Promise<VaccinationPlan> {
        const { pet_id, species_vaccination_plan_id, status } = createVaccinationPlanDto;

        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ 
            where: { id: pet_id, owner: { companyId } },
            relations: ['species'] 
        });
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
        }

        // Verificar si el plan de vacunación por especie existe
        const speciesVaccinationPlan = await this.speciesVaccinationPlanRepository.findOne({ 
            where: { id: species_vaccination_plan_id, companyId },
            relations: ['species', 'vaccines']
        });
        if (!speciesVaccinationPlan) {
            throw new NotFoundException(`Plan de vacunación por especie con ID ${species_vaccination_plan_id} no encontrado`);
        }

        // Verificar que el plan de vacunación por especie corresponda a la especie de la mascota
        if (speciesVaccinationPlan.species_id !== pet.species_id) {
            throw new BadRequestException(`El plan de vacunación seleccionado no corresponde a la especie de la mascota`);
        }

        // Verificar si la mascota ya tiene este plan de vacunación asignado
        const existingPlan = await this.vaccinationPlanRepository.findOne({
            where: { 
                pet_id, 
                species_vaccination_plan_id,
                status: 'activo',
                species_vaccination_plan: { companyId } 
            }
        });

        if (existingPlan) {
            throw new BadRequestException(`La mascota ya tiene asignado este plan de vacunación`);
        }

        // Crear el plan de vacunación
        const vaccinationPlan = this.vaccinationPlanRepository.create({
            pet_id,
            species_vaccination_plan_id,
            status: status || 'activo',
        });

        const savedPlan = await this.vaccinationPlanRepository.save(vaccinationPlan);

        // Clonar las vacunas del plan para crear registros específicos para esta mascota
        if (speciesVaccinationPlan.vaccines && speciesVaccinationPlan.vaccines.length > 0) {
            const now = new Date();
            const petAge = pet.age || 0; // Edad en meses
            
            for (const vaccine of speciesVaccinationPlan.vaccines) {
                // Calcular la fecha programada basada en la edad de la mascota y la edad de aplicación de la vacuna
                let scheduledDate: Date | null = null;
                let isEnabled = true;
                
                if (petAge >= vaccine.application_age) {
                    // Para mascotas adultas o que ya pasaron la edad de aplicación
                    if (vaccine.is_mandatory) {
                        // Si es obligatoria, programar para pronto
                        // scheduledDate = new Date(now);
                        // scheduledDate.setDate(scheduledDate.getDate() + 7);
                    } else {
                        // Si no es obligatoria, programar pero posiblemente deshabilitar
                        // scheduledDate = new Date(now);
                        // scheduledDate.setDate(scheduledDate.getDate() + 14);
                        // Podría deshabilitarse basado en criterios adicionales
                        isEnabled = petAge - vaccine.application_age <= 6; // ejemplo: deshabilitar si pasaron más de 6 meses
                    }
                } else {
                    // Para mascotas jóvenes que aún no han alcanzado la edad de aplicación
                    const monthsToWait = vaccine.application_age - petAge;
                    scheduledDate = new Date(now);
                    scheduledDate.setMonth(scheduledDate.getMonth() + monthsToWait);
                }
                
                // Crear el registro de vacunación con la nueva estructura
                await this.vaccinationRecordRepository.save({
                    vaccination_plan_id: savedPlan.id,
                    vaccine_id: vaccine.id,
                    plan_vaccine_id: vaccine.id, // Referencia a la vacuna original del plan
                    enabled: isEnabled,
                    scheduled_date: null,
                    status: 'pendiente',
                    notes: `Vacuna clonada del plan: ${vaccine.name}`
                });
            }
        }

        // Retornar el plan con sus registros
        return this.findOne(savedPlan.id, companyId);
    }

    async findAll(companyId: number, filterDto?: VaccinationPlanFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new VaccinationPlanFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.vaccinationPlanRepository
            .createQueryBuilder('vp')
            .leftJoinAndSelect('vp.pet', 'pet')
            .leftJoinAndSelect('pet.owner', 'owner')
            .leftJoinAndSelect('owner.person', 'owner_person')
            .leftJoinAndSelect('vp.species_vaccination_plan', 'svp')
            .leftJoinAndSelect('svp.species', 'species')
            .leftJoinAndSelect('vp.vaccination_records', 'records')
            .leftJoinAndSelect('records.vaccine', 'vaccine')
            .leftJoinAndSelect('records.plan_vaccine', 'plan_vaccine')
            .where('svp.companyId = :companyId', { companyId });
            
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
        
        // Filtros para la mascota relacionada
        if (filters.pet_name) {
            queryBuilder.andWhere('pet.name ILIKE :pet_name', { pet_name: `%${filters.pet_name}%` });
        }
        
        if (filters.owner_id) {
            queryBuilder.andWhere('pet.owner_id = :owner_id', { owner_id: filters.owner_id });
        }
        
        if (filters.owner_name) {
            queryBuilder.andWhere('owner_person.full_name ILIKE :owner_name', { owner_name: `%${filters.owner_name}%` });
        }
        
        // Filtros para el plan de vacunación por especie
        if (filters.species_id) {
            queryBuilder.andWhere('svp.species_id = :species_id', { species_id: filters.species_id });
        }
        
        if (filters.plan_name) {
            queryBuilder.andWhere('svp.name ILIKE :plan_name', { plan_name: `%${filters.plan_name}%` });
        }

        // Filtros para el plan de vacunación por especie
        // Filtros de fechas
        if (filters.scheduled_date_start && filters.scheduled_date_end) {
            queryBuilder.andWhere('records.scheduled_date BETWEEN :start AND :end', {
                start: filters.scheduled_date_start,
                end: filters.scheduled_date_end
            });
        } else if (filters.scheduled_date_start) {
            queryBuilder.andWhere('records.scheduled_date >= :start', { start: filters.scheduled_date_start });
        } else if (filters.scheduled_date_end) {
            queryBuilder.andWhere('records.scheduled_date <= :end', { end: filters.scheduled_date_end });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('vp.id', 'DESC')
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

    async findOne(id: number, companyId: number): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.vaccinationPlanRepository.findOne({
            where: { id, species_vaccination_plan: { companyId } },
            relations: [
                'pet', 
                'pet.owner', 
                'pet.owner.person',
                'species_vaccination_plan', 
                'vaccination_records',
                'vaccination_records.vaccine',
                'vaccination_records.plan_vaccine'
            ],
        });

        if (!vaccinationPlan) {
            throw new NotFoundException(`Plan de vacunación con ID ${id} no encontrado`);
        }

        return vaccinationPlan;
    }

    async findByPet(petId: number, companyId: number, filterDto?: VaccinationPlanFilterDto): Promise<any> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId, owner: { companyId } }, relations: ['owner']});
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new VaccinationPlanFilterDto();
        
        // Establecer el ID de la mascota en los filtros
        filters.pet_id = petId;
        
        // Usar el método findAll con los filtros
        return this.findAll(companyId, filters);
    }

    async update(id: number, updateVaccinationPlanDto: UpdateVaccinationPlanDto, companyId: number): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.findOne(id, companyId);
        
        // Si se intenta cambiar la mascota, verificar que exista
        if (updateVaccinationPlanDto.pet_id && 
            updateVaccinationPlanDto.pet_id !== vaccinationPlan.pet_id) {
            const pet = await this.petRepository.findOne({ 
                where: { id: updateVaccinationPlanDto.pet_id, owner: { companyId } },
                relations: ['species', 'owner']
            });
            
            if (!pet) {
                throw new NotFoundException(`Mascota con ID ${updateVaccinationPlanDto.pet_id} no encontrada`);
            }

            // Si también se cambia el plan de vacunación por especie, verificar que corresponda a la nueva mascota
            if (updateVaccinationPlanDto.species_vaccination_plan_id) {
                const speciesVaccinationPlan = await this.speciesVaccinationPlanRepository.findOne({ 
                    where: { id: updateVaccinationPlanDto.species_vaccination_plan_id, companyId }
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
                where: { id: vaccinationPlan.pet_id, owner: { companyId } },
                relations: ['species', 'owner']
            });
            
            const speciesVaccinationPlan = await this.speciesVaccinationPlanRepository.findOne({ 
                where: { id: updateVaccinationPlanDto.species_vaccination_plan_id, companyId } 
            });
            
            if (!speciesVaccinationPlan) {
                throw new NotFoundException(`Plan de vacunación por especie con ID ${updateVaccinationPlanDto.species_vaccination_plan_id} no encontrado`);
            }

            if (pet && speciesVaccinationPlan.species_id !== pet.species_id) {
                throw new BadRequestException(`El plan de vacunación seleccionado no corresponde a la especie de la mascota`);
            }
        }

        await this.vaccinationPlanRepository.update(id,updateVaccinationPlanDto);
        return this.findOne(id, companyId);
    }

    async deactivate(id: number, companyId: number): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.findOne(id, companyId);
        
        if (vaccinationPlan.status === 'inactivo') {
            throw new BadRequestException('Este plan de vacunación ya está inactivo');
        }

        vaccinationPlan.status = 'inactivo';
        
        return this.vaccinationPlanRepository.save(vaccinationPlan);
    }

    async activate(id: number, companyId: number): Promise<VaccinationPlan> {
        const vaccinationPlan = await this.findOne(id, companyId);
        
        if (vaccinationPlan.status === 'activo') {
            throw new BadRequestException('Este plan de vacunación ya está activo');
        }

        vaccinationPlan.status = 'activo';
        
        return this.vaccinationPlanRepository.save(vaccinationPlan);
    }

    async remove(id: number, companyId: number): Promise<void> {
        const vaccinationPlan = await this.findOne(id, companyId);
        if (!vaccinationPlan) {
            throw new NotFoundException(`Plan de vacunación con ID ${id} no encontrado`);
        }

        await this.vaccinationPlanRepository.softDelete(id);
    }

    // Métodos para gestionar los registros de vacunación
    async toggleVaccineEnabled(recordId: number, enabled: boolean): Promise<VaccinationRecord> {
        const record = await this.vaccinationRecordRepository.findOne({
            where: { id: recordId },
            relations: ['vaccination_plan', 'vaccine']
        });
        
        if (!record) {
            throw new NotFoundException(`Registro de vacunación con ID ${recordId} no encontrado`);
        }

        if (record.status === 'completado') {
            throw new BadRequestException(`No se puede modificar un registro de vacunación completado`);
        }

        record.enabled = enabled;
        if (!enabled) {
            record.notes = (record.notes || '') + `\nDeshabilitada el ${new Date().toISOString()}`;
        } else {
            record.notes = (record.notes || '') + `\nHabilitada el ${new Date().toISOString()}`;
        }
        
        return this.vaccinationRecordRepository.save(record);
    }

    async updateVaccinationRecord(recordId: number, updateDto: UpdateVaccinationRecordDto, companyId: number): Promise<VaccinationRecord | null> {
        const record = await this.vaccinationRecordRepository.findOne({
            where: { id: recordId, vaccination_plan: { species_vaccination_plan: { companyId } } },
            relations: ['vaccination_plan', 'vaccine']
        });
        
        if (!record) {
            throw new NotFoundException(`Registro de vacunación con ID ${recordId} no encontrado`);
        }

        // Validaciones específicas
        if (updateDto.status === 'completado' && !updateDto.administered_date && !record.administered_date) {
            throw new BadRequestException(`Debe proporcionar una fecha de administración para completar el registro`);
        }

        // Si se intenta cambiar la vacuna, verificar que exista
        if (updateDto.vaccine_id && updateDto.vaccine_id !== record.vaccine_id) {
            const vaccine = await this.vaccineRepository.findOne({ 
                where: { id: updateDto.vaccine_id } 
            });
            
            if (!vaccine) {
                throw new NotFoundException(`Vacuna con ID ${updateDto.vaccine_id} no encontrada`);
            }
        }

        if(updateDto.notes) {
            updateDto.notes = (record.notes ? record.notes + '\n' : '') + updateDto.notes;
        }

        // Si se está marcando como completado, asegurar que tenga fecha de administración
        if (updateDto.status === 'completado' && !record.administered_date) {
            updateDto.administered_date = new Date();
        }
        await this.vaccinationRecordRepository.update(recordId, updateDto);
        
        return this.vaccinationRecordRepository.findOne({
            where: { id: recordId, vaccination_plan: { species_vaccination_plan: { companyId } } },
            relations: ['vaccination_plan', 'vaccine', 'vaccination_plan.species_vaccination_plan']
        });
    }

    async applyVaccine(recordId: number, companyId: number, administeredDate?: Date, notes?: string): Promise<VaccinationRecord> {
        const record = await this.vaccinationRecordRepository.findOne({
            where: { id: recordId, vaccination_plan: { species_vaccination_plan: { companyId } } },
            relations: ['vaccination_plan', 'vaccine', 'vaccination_plan.species_vaccination_plan']
        });
        
        if (!record) {
            throw new NotFoundException(`Registro de vacunación con ID ${recordId} no encontrado`);
        }

        if (!record.enabled) {
            throw new BadRequestException(`Esta vacuna está deshabilitada y no puede ser aplicada`);
        }

        if (record.status === 'completado') {
            throw new BadRequestException(`Esta vacuna ya ha sido aplicada`);
        }

        record.status = 'completado';
        record.administered_date = administeredDate || new Date();
        if (notes) {
            record.notes = (record.notes || '') + `\n${notes}`;
        }
        
        return this.vaccinationRecordRepository.save(record);
    }

    // Métodos para gestionar los registros de vacunación manteniendo compatibilidad
    async findVaccinationRecords(companyId: number,filterDto?: VaccinationRecordFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new VaccinationRecordFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.vaccinationRecordRepository
            .createQueryBuilder('record')
            .leftJoinAndSelect('record.vaccination_plan', 'plan')
            .leftJoinAndSelect('record.vaccine', 'vaccine')
            .leftJoinAndSelect('plan.pet', 'pet')
            .leftJoinAndSelect('plan.species_vaccination_plan', 'speciesPlan')
            .where('speciesPlan.companyId = :companyId', { companyId });

            
        // Aplicar filtros
        if (filters.vaccination_plan_id) {
            queryBuilder.andWhere('record.vaccination_plan_id = :planId', { 
                planId: filters.vaccination_plan_id 
            });
        }
        
        if (filters.vaccine_id) {
            queryBuilder.andWhere('record.vaccine_id = :vaccineId', { 
                vaccineId: filters.vaccine_id 
            });
        }
        
        if (filters.status) {
            queryBuilder.andWhere('record.status = :status', { status: filters.status });
        }
        
        if (filters.enabled !== undefined) {
            queryBuilder.andWhere('record.enabled = :enabled', { enabled: filters.enabled });
        }
        
        if (filters.plan_vaccine_id) {
            queryBuilder.andWhere('record.plan_vaccine_id = :planVaccineId', { 
                planVaccineId: filters.plan_vaccine_id 
            });
        }
        
        // Filtros de fechas
        if (filters.scheduled_date_start && filters.scheduled_date_end) {
            queryBuilder.andWhere('record.scheduled_date BETWEEN :start AND :end', {
                start: filters.scheduled_date_start,
                end: filters.scheduled_date_end
            });
        } else if (filters.scheduled_date_start) {
            queryBuilder.andWhere('record.scheduled_date >= :start', { start: filters.scheduled_date_start });
        } else if (filters.scheduled_date_end) {
            queryBuilder.andWhere('record.scheduled_date <= :end', { end: filters.scheduled_date_end });
        }
        
        if (filters.administered_date_start && filters.administered_date_end) {
            queryBuilder.andWhere('record.administered_date BETWEEN :admStart AND :admEnd', {
                admStart: filters.administered_date_start,
                admEnd: filters.administered_date_end
            });
        } else if (filters.administered_date_start) {
            queryBuilder.andWhere('record.administered_date >= :admStart', { admStart: filters.administered_date_start });
        } else if (filters.administered_date_end) {
            queryBuilder.andWhere('record.administered_date <= :admEnd', { admEnd: filters.administered_date_end });
        }
        
        // Búsqueda por nombre de vacuna
        if (filters.vaccine_name) {
            queryBuilder.andWhere('vaccine.name ILIKE :vacName', { vacName: `%${filters.vaccine_name}%` });
        }
        
        // Búsqueda por contenido de notas
        if (filters.notes_contains) {
            queryBuilder.andWhere('record.notes ILIKE :notes', { notes: `%${filters.notes_contains}%` });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('record.scheduled_date', 'ASC')
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

    async addVaccinationRecord(createVaccinationRecordDto: CreateVaccinationRecordDto, companyId: number): Promise<VaccinationRecord> {
        const { vaccination_plan_id, vaccine_id, scheduled_date, status } = createVaccinationRecordDto;

        // Verificar si el plan de vacunación existe
        const plan = await this.vaccinationPlanRepository.findOne({ 
            where: { id: vaccination_plan_id, species_vaccination_plan: { companyId } },
            relations: ['pet', 'species_vaccination_plan']
        });
        
        if (!plan) {
            throw new NotFoundException(`Plan de vacunación con ID ${vaccination_plan_id} no encontrado`);
        }

        // Verificar si la vacuna existe
        const vaccine = await this.vaccineRepository.findOne({ 
            where: { id: vaccine_id, species_vaccination_plan: { companyId } },
            relations: ['species_vaccination_plan']
        });
        
        if (!vaccine) {
            throw new NotFoundException(`Vacuna con ID ${vaccine_id} no encontrada`);
        }

        // Verificar que la vacuna pertenezca al plan de la especie
        if (vaccine.species_vaccination_plan_id !== plan.species_vaccination_plan_id) {
            throw new BadRequestException(`La vacuna seleccionada no pertenece al plan de vacunación de la especie`);
        }

        // Verificar si ya existe un registro para esta vacuna en este plan
        const existingRecord = await this.vaccinationRecordRepository.findOne({
            where: { 
                vaccination_plan_id, 
                vaccine_id,
                status: 'pendiente',
            }
        });

        if (existingRecord) {
            throw new BadRequestException(`Ya existe un registro pendiente para esta vacuna en este plan`);
        }

        // Crear el registro de vacunación
        const record = this.vaccinationRecordRepository.create({
            vaccination_plan_id,
            vaccine_id,
            plan_vaccine_id: createVaccinationRecordDto.plan_vaccine_id || vaccine_id,
            enabled: createVaccinationRecordDto.enabled !== undefined ? createVaccinationRecordDto.enabled : true,
            scheduled_date,
            status: status || 'pendiente',
            notes: createVaccinationRecordDto.notes
        });

        return this.vaccinationRecordRepository.save(record);
    }

    async completeVaccinationRecord(recordId: number, companyId: number, administered_date: Date): Promise<VaccinationRecord> {
        return this.applyVaccine(recordId, companyId, administered_date);
    }

    async cancelVaccinationRecord(recordId: number, companyId: number): Promise<VaccinationRecord> {
        const record = await this.vaccinationRecordRepository.findOne({
            where: { id: recordId, vaccination_plan: { species_vaccination_plan: { companyId } } },
            relations: ['vaccination_plan', 'vaccine', 'vaccination_plan.species_vaccination_plan']
        });
        
        if (!record) {
            throw new NotFoundException(`Registro de vacunación con ID ${recordId} no encontrado`);
        }

        if (record.status === 'completado') {
            throw new BadRequestException(`No se puede cancelar un registro de vacunación completado`);
        }

        if (record.status === 'cancelado') {
            throw new BadRequestException(`Este registro de vacunación ya está cancelado`);
        }

        record.status = 'cancelado';
        record.notes = (record.notes || '') + `\nCancelado el ${new Date().toISOString()}`;
        
        return this.vaccinationRecordRepository.save(record);
    }

    async rescheduleVaccinationRecord(recordId: number, companyId: number, scheduled_date: Date): Promise<VaccinationRecord> {
        const record = await this.vaccinationRecordRepository.findOne({
            where: { id: recordId, vaccination_plan: { species_vaccination_plan: { companyId } } },
            relations: ['vaccination_plan', 'vaccine', 'vaccination_plan.species_vaccination_plan']
        });
        
        if (!record) {
            throw new NotFoundException(`Registro de vacunación con ID ${recordId} no encontrado`);
        }

        if (record.status === 'completado') {
            throw new BadRequestException(`No se puede reprogramar un registro de vacunación completado`);
        }

        if (record.status === 'cancelado') {
            throw new BadRequestException(`No se puede reprogramar un registro de vacunación cancelado`);
        }

        const oldDate = record.scheduled_date;
        record.scheduled_date = scheduled_date;
        // record.notes = (record.notes || '') + `\nReprogramado de ${oldDate.toISOString()} a ${scheduled_date.toISOString()}`;
        
        return this.vaccinationRecordRepository.save(record);
    }
}