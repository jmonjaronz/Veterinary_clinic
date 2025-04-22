import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from './entities/treatment.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { TreatmentFilterDto } from './dto/treatment-filter.dto';

@Injectable()
export class TreatmentsService {
    constructor(
        @InjectRepository(Treatment)
        private readonly treatmentRepository: Repository<Treatment>,
        @InjectRepository(MedicalRecord)
        private readonly medicalRecordRepository: Repository<MedicalRecord>,
    ) {}

    async create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment> {
        const { medical_record_id } = createTreatmentDto;

        // Verificar si el registro médico existe
        const medicalRecord = await this.medicalRecordRepository.findOne({ 
            where: { id: medical_record_id } 
        });
        if (!medicalRecord) {
            throw new NotFoundException(`Registro médico con ID ${medical_record_id} no encontrado`);
        }

        // Crear el tratamiento
        const treatment = this.treatmentRepository.create(createTreatmentDto);
        return this.treatmentRepository.save(treatment);
    }

    async findAll(filterDto?: TreatmentFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new TreatmentFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.treatmentRepository
            .createQueryBuilder('treatment')
            .leftJoinAndSelect('treatment.medical_record', 'medical_record')
            .leftJoinAndSelect('medical_record.pet', 'pet')
            .leftJoinAndSelect('medical_record.veterinarian', 'veterinarian');
            
        // Aplicar filtros básicos
        if (filters.medical_record_id) {
            queryBuilder.andWhere('treatment.medical_record_id = :medical_record_id', { 
                medical_record_id: filters.medical_record_id 
            });
        }
        
        if (filters.pet_id) {
            queryBuilder.andWhere('medical_record.pet_id = :pet_id', { pet_id: filters.pet_id });
        }
        
        if (filters.veterinarian_id) {
            queryBuilder.andWhere('medical_record.veterinarian_id = :vet_id', { 
                vet_id: filters.veterinarian_id 
            });
        }
        
        // Filtros de fecha
        if (filters.date_start && filters.date_end) {
            queryBuilder.andWhere('treatment.date BETWEEN :start AND :end', {
                start: filters.date_start,
                end: filters.date_end
            });
        } else if (filters.date_start) {
            queryBuilder.andWhere('treatment.date >= :start', { start: filters.date_start });
        } else if (filters.date_end) {
            queryBuilder.andWhere('treatment.date <= :end', { end: filters.date_end });
        }
        
        // Búsqueda de texto en campos
        if (filters.reason_contains) {
            queryBuilder.andWhere('treatment.reason LIKE :reason', { 
                reason: `%${filters.reason_contains}%` 
            });
        }
        
        if (filters.diagnosis_contains) {
            queryBuilder.andWhere('treatment.diagnosis LIKE :diagnosis', { 
                diagnosis: `%${filters.diagnosis_contains}%` 
            });
        }
        
        if (filters.treatment_contains) {
            queryBuilder.andWhere('treatment.treatment LIKE :treatment', { 
                treatment: `%${filters.treatment_contains}%` 
            });
        }
        
        if (filters.examinations_contains) {
            queryBuilder.andWhere('treatment.examinations LIKE :examinations', { 
                examinations: `%${filters.examinations_contains}%` 
            });
        }
        
        // Filtros para la mascota relacionada
        if (filters.pet_name) {
            queryBuilder.andWhere('pet.name LIKE :pet_name', { pet_name: `%${filters.pet_name}%` });
        }
        
        // Filtros para el veterinario
        if (filters.veterinarian_name) {
            queryBuilder.andWhere('veterinarian.full_name LIKE :vet_name', { 
                vet_name: `%${filters.veterinarian_name}%` 
            });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('treatment.date', 'DESC')
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

    async findOne(id: number): Promise<Treatment> {
        const treatment = await this.treatmentRepository.findOne({
            where: { id },
            relations: ['medical_record', 'medical_record.pet', 'medical_record.veterinarian'],
        });

        if (!treatment) {
            throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
        }

        return treatment;
    }

    async findByMedicalRecord(medicalRecordId: number, filterDto?: TreatmentFilterDto): Promise<any> {
        // Verificar si el registro médico existe
        const medicalRecord = await this.medicalRecordRepository.findOne({ 
            where: { id: medicalRecordId } 
        });
        if (!medicalRecord) {
            throw new NotFoundException(`Registro médico con ID ${medicalRecordId} no encontrado`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new TreatmentFilterDto();
        
        // Establecer el ID del registro médico en los filtros
        filters.medical_record_id = medicalRecordId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async findByPet(petId: number, filterDto?: TreatmentFilterDto): Promise<any> {
        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new TreatmentFilterDto();
        
        // Establecer el ID de la mascota en los filtros
        filters.pet_id = petId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async findByVeterinarian(veterinarianId: number, filterDto?: TreatmentFilterDto): Promise<any> {
        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new TreatmentFilterDto();
        
        // Establecer el ID del veterinario en los filtros
        filters.veterinarian_id = veterinarianId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async update(id: number, updateTreatmentDto: UpdateTreatmentDto): Promise<Treatment> {
        const treatment = await this.findOne(id);
        
        // Si se intenta cambiar el registro médico, verificar que exista
        if (updateTreatmentDto.medical_record_id && 
            updateTreatmentDto.medical_record_id !== treatment.medical_record_id) {
            const medicalRecord = await this.medicalRecordRepository.findOne({ 
                where: { id: updateTreatmentDto.medical_record_id } 
            });
            
            if (!medicalRecord) {
                throw new NotFoundException(`Registro médico con ID ${updateTreatmentDto.medical_record_id} no encontrado`);
            }
        }

        // Actualizar los campos
        Object.assign(treatment, updateTreatmentDto);
        
        return this.treatmentRepository.save(treatment);
    }

    async remove(id: number): Promise<void> {
        const result = await this.treatmentRepository.delete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
        }
    }
}