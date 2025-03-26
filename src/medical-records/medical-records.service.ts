import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordFilterDto } from './dto/medical-record-filter.dto';

@Injectable()
export class MedicalRecordsService {
    constructor(
        @InjectRepository(MedicalRecord)
        private readonly medicalRecordRepository: Repository<MedicalRecord>,
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {}

    async create(createMedicalRecordDto: CreateMedicalRecordDto): Promise<MedicalRecord> {
        const { pet_id, appointment_id, veterinarian_id, diagnosis, treatment } = createMedicalRecordDto;

        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: pet_id } });
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
        }

        // Verificar si el veterinario existe y es staff
        const veterinarian = await this.personRepository.findOne({ where: { id: veterinarian_id } });
        if (!veterinarian) {
            throw new NotFoundException(`Persona con ID ${veterinarian_id} no encontrada`);
        }

        if (veterinarian.role !== 'staff') {
            throw new BadRequestException(`La persona con ID ${veterinarian_id} no es un miembro del staff`);
        }

        // Verificar si la cita existe si se proporciona
        if (appointment_id) {
            const appointment = await this.appointmentRepository.findOne({ where: { id: appointment_id } });
            if (!appointment) {
                throw new NotFoundException(`Cita con ID ${appointment_id} no encontrada`);
            }

            // Verificar que la cita corresponde a la mascota y al veterinario
            if (appointment.pet_id !== pet_id) {
                throw new BadRequestException(`La cita con ID ${appointment_id} no corresponde a la mascota con ID ${pet_id}`);
            }

            if (appointment.veterinarian_id !== veterinarian_id) {
                throw new BadRequestException(`La cita con ID ${appointment_id} no corresponde al veterinario con ID ${veterinarian_id}`);
            }

            // Si la cita no está completada, completarla automáticamente
            if (appointment.status !== 'completada') {
                appointment.status = 'completada';
                await this.appointmentRepository.save(appointment);
            }
        }

        // Crear el registro médico
        const medicalRecord = this.medicalRecordRepository.create({
            pet_id,
            appointment_id,
            veterinarian_id,
            diagnosis,
            treatment,
            prescriptions: createMedicalRecordDto.prescriptions,
            notes: createMedicalRecordDto.notes,
            appointment_date: createMedicalRecordDto.appointment_date,
        });

        return this.medicalRecordRepository.save(medicalRecord);
    }

    async findAll(filterDto?: MedicalRecordFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new MedicalRecordFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.medicalRecordRepository
            .createQueryBuilder('mr')
            .leftJoinAndSelect('mr.pet', 'pet')
            .leftJoinAndSelect('pet.owner', 'owner')
            .leftJoinAndSelect('mr.veterinarian', 'veterinarian')
            .leftJoinAndSelect('mr.appointment', 'appointment');
            
        // Aplicar filtros básicos
        if (filters.pet_id) {
            queryBuilder.andWhere('mr.pet_id = :pet_id', { pet_id: filters.pet_id });
        }
        
        if (filters.veterinarian_id) {
            queryBuilder.andWhere('mr.veterinarian_id = :vet_id', { vet_id: filters.veterinarian_id });
        }
        
        if (filters.appointment_id) {
            queryBuilder.andWhere('mr.appointment_id = :app_id', { app_id: filters.appointment_id });
        }
        
        // Búsqueda de texto en campos de texto largo
        if (filters.diagnosis_contains) {
            queryBuilder.andWhere('mr.diagnosis LIKE :diagnosis', { diagnosis: `%${filters.diagnosis_contains}%` });
        }
        
        if (filters.treatment_contains) {
            queryBuilder.andWhere('mr.treatment LIKE :treatment', { treatment: `%${filters.treatment_contains}%` });
        }
        
        if (filters.prescriptions_contains) {
            queryBuilder.andWhere('mr.prescriptions LIKE :prescriptions', { prescriptions: `%${filters.prescriptions_contains}%` });
        }
        
        // Filtros de rango para fecha de cita médica
        if (filters.appointment_date_start && filters.appointment_date_end) {
            queryBuilder.andWhere('mr.appointment_date BETWEEN :start AND :end', {
                start: filters.appointment_date_start,
                end: filters.appointment_date_end
            });
        } else if (filters.appointment_date_start) {
            queryBuilder.andWhere('mr.appointment_date >= :start', { start: filters.appointment_date_start });
        } else if (filters.appointment_date_end) {
            queryBuilder.andWhere('mr.appointment_date <= :end', { end: filters.appointment_date_end });
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
        
        // Filtros para el veterinario
        if (filters.veterinarian_name) {
            queryBuilder.andWhere('veterinarian.full_name LIKE :vet_name', { vet_name: `%${filters.veterinarian_name}%` });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('mr.appointment_date', 'DESC')
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

    async findOne(id: number): Promise<MedicalRecord> {
        const medicalRecord = await this.medicalRecordRepository.findOne({
            where: { id },
            relations: ['pet', 'pet.owner', 'veterinarian', 'appointment'],
        });

        if (!medicalRecord) {
            throw new NotFoundException(`Registro médico con ID ${id} no encontrado`);
        }

        return medicalRecord;
    }

    async findByPet(petId: number, filterDto?: MedicalRecordFilterDto): Promise<any> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId } });
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new MedicalRecordFilterDto();
        
        // Establecer el ID de la mascota en los filtros
        filters.pet_id = petId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async findByVeterinarian(veterinarianId: number, filterDto?: MedicalRecordFilterDto): Promise<any> {
        // Verificar si el veterinario existe
        const veterinarian = await this.personRepository.findOne({ where: { id: veterinarianId } });
        if (!veterinarian) {
            throw new NotFoundException(`Persona con ID ${veterinarianId} no encontrada`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new MedicalRecordFilterDto();
        
        // Establecer el ID del veterinario en los filtros
        filters.veterinarian_id = veterinarianId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async findByAppointment(appointmentId: number, filterDto?: MedicalRecordFilterDto): Promise<any> {
        // Verificar si la cita existe
        const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
        if (!appointment) {
            throw new NotFoundException(`Cita con ID ${appointmentId} no encontrada`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new MedicalRecordFilterDto();
        
        // Establecer el ID de la cita en los filtros
        filters.appointment_id = appointmentId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async update(id: number, updateMedicalRecordDto: UpdateMedicalRecordDto): Promise<MedicalRecord> {
        const medicalRecord = await this.findOne(id);
        
        // Si se intenta cambiar la mascota, verificar que exista
        if (updateMedicalRecordDto.pet_id && 
            updateMedicalRecordDto.pet_id !== medicalRecord.pet_id) {
            const pet = await this.petRepository.findOne({ where: { id: updateMedicalRecordDto.pet_id } });
            
            if (!pet) {
                throw new NotFoundException(`Mascota con ID ${updateMedicalRecordDto.pet_id} no encontrada`);
            }
        }

        // Si se intenta cambiar el veterinario, verificar que exista y sea staff
        if (updateMedicalRecordDto.veterinarian_id && 
            updateMedicalRecordDto.veterinarian_id !== medicalRecord.veterinarian_id) {
            const veterinarian = await this.personRepository.findOne({ 
                where: { id: updateMedicalRecordDto.veterinarian_id } 
            });
            
            if (!veterinarian) {
                throw new NotFoundException(`Persona con ID ${updateMedicalRecordDto.veterinarian_id} no encontrada`);
            }

            if (veterinarian.role !== 'staff') {
                throw new BadRequestException(`La persona con ID ${updateMedicalRecordDto.veterinarian_id} no es un miembro del staff`);
            }
        }

        // Si se intenta cambiar la cita, verificar que exista y corresponda a la mascota y al veterinario
        if (updateMedicalRecordDto.appointment_id && 
            updateMedicalRecordDto.appointment_id !== medicalRecord.appointment_id) {
            const appointment = await this.appointmentRepository.findOne({ 
                where: { id: updateMedicalRecordDto.appointment_id } 
            });
            
            if (!appointment) {
                throw new NotFoundException(`Cita con ID ${updateMedicalRecordDto.appointment_id} no encontrada`);
            }

            const petId = updateMedicalRecordDto.pet_id || medicalRecord.pet_id;
            const veterinarianId = updateMedicalRecordDto.veterinarian_id || medicalRecord.veterinarian_id;

            if (appointment.pet_id !== petId) {
                throw new BadRequestException(`La cita con ID ${updateMedicalRecordDto.appointment_id} no corresponde a la mascota con ID ${petId}`);
            }

            if (appointment.veterinarian_id !== veterinarianId) {
                throw new BadRequestException(`La cita con ID ${updateMedicalRecordDto.appointment_id} no corresponde al veterinario con ID ${veterinarianId}`);
            }

            // Si la cita no está completada, completarla automáticamente
            if (appointment.status !== 'completada') {
                appointment.status = 'completada';
                await this.appointmentRepository.save(appointment);
            }
        }

        // Actualizar los campos
        Object.assign(medicalRecord, updateMedicalRecordDto);
        
        return this.medicalRecordRepository.save(medicalRecord);
    }

    async remove(id: number): Promise<void> {
        const result = await this.medicalRecordRepository.delete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Registro médico con ID ${id} no encontrado`);
        }
    }
}