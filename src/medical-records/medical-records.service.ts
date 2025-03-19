import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

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

    async findAll(): Promise<MedicalRecord[]> {
        return this.medicalRecordRepository.find({
        relations: ['pet', 'pet.owner', 'veterinarian', 'appointment'],
        order: { appointment_date: 'DESC' }
        });
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

    async findByPet(petId: number): Promise<MedicalRecord[]> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId } });
        if (!pet) {
        throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        return this.medicalRecordRepository.find({
        where: { pet_id: petId },
        relations: ['pet', 'pet.owner', 'veterinarian', 'appointment'],
        order: { appointment_date: 'DESC' }
        });
    }

    async findByVeterinarian(veterinarianId: number): Promise<MedicalRecord[]> {
        // Verificar si el veterinario existe
        const veterinarian = await this.personRepository.findOne({ where: { id: veterinarianId } });
        if (!veterinarian) {
        throw new NotFoundException(`Persona con ID ${veterinarianId} no encontrada`);
        }

        return this.medicalRecordRepository.find({
        where: { veterinarian_id: veterinarianId },
        relations: ['pet', 'pet.owner', 'veterinarian', 'appointment'],
        order: { appointment_date: 'DESC' }
        });
    }

    async findByAppointment(appointmentId: number): Promise<MedicalRecord[]> {
        // Verificar si la cita existe
        const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
        if (!appointment) {
        throw new NotFoundException(`Cita con ID ${appointmentId} no encontrada`);
        }

        return this.medicalRecordRepository.find({
        where: { appointment_id: appointmentId },
        relations: ['pet', 'pet.owner', 'veterinarian', 'appointment'],
        });
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