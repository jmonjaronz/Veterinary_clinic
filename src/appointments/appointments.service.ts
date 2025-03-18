import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, Not } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
    ) {}

    async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
        const { pet_id, veterinarian_id, appointment_type, date } = createAppointmentDto;

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

        // Verificar disponibilidad del veterinario (no tener otra cita en el mismo horario)
        const appointmentDate = new Date(date);
        const startTime = new Date(appointmentDate);
        const endTime = new Date(appointmentDate);
        endTime.setMinutes(appointmentDate.getMinutes() + 30); // Asumimos citas de 30 minutos

        const existingAppointment = await this.appointmentRepository.findOne({
        where: {
            veterinarian_id,
            date: Between(startTime, endTime),
            status: 'programada'
        }
        });

        if (existingAppointment) {
        throw new ConflictException(`El veterinario ya tiene una cita programada en este horario`);
        }

        // Crear la cita
        const appointment = this.appointmentRepository.create({
        pet_id,
        veterinarian_id,
        appointment_type,
        date: appointmentDate,
        status: createAppointmentDto.status || 'programada',
        document: createAppointmentDto.document,
        });

        return this.appointmentRepository.save(appointment);
    }

    async findAll(): Promise<Appointment[]> {
        return this.appointmentRepository.find({
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { date: 'DESC' }
        });
    }

    async findOne(id: number): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
        where: { id },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        });

        if (!appointment) {
        throw new NotFoundException(`Cita con ID ${id} no encontrada`);
        }

        return appointment;
    }

    async findByPet(petId: number): Promise<Appointment[]> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId } });
        if (!pet) {
        throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        return this.appointmentRepository.find({
        where: { pet_id: petId },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { date: 'DESC' }
        });
    }

    async findByVeterinarian(veterinarianId: number): Promise<Appointment[]> {
        // Verificar si el veterinario existe
        const veterinarian = await this.personRepository.findOne({ where: { id: veterinarianId } });
        if (!veterinarian) {
        throw new NotFoundException(`Persona con ID ${veterinarianId} no encontrada`);
        }

        return this.appointmentRepository.find({
        where: { veterinarian_id: veterinarianId },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { date: 'DESC' }
        });
    }

    async findUpcoming(): Promise<Appointment[]> {
        const now = new Date();
        
        return this.appointmentRepository.find({
        where: {
            date: MoreThanOrEqual(now),
            status: 'programada'
        },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { date: 'ASC' }
        });
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
        return this.appointmentRepository.find({
        where: {
            date: Between(startDate, endDate)
        },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { date: 'ASC' }
        });
    }

    async update(id: number, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
        const appointment = await this.findOne(id);
        
        // Si se intenta cambiar la mascota, verificar que exista
        if (updateAppointmentDto.pet_id && 
            updateAppointmentDto.pet_id !== appointment.pet_id) {
        const pet = await this.petRepository.findOne({ where: { id: updateAppointmentDto.pet_id } });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${updateAppointmentDto.pet_id} no encontrada`);
        }
        }

        // Si se intenta cambiar el veterinario, verificar que exista y sea staff
        if (updateAppointmentDto.veterinarian_id && 
            updateAppointmentDto.veterinarian_id !== appointment.veterinarian_id) {
        const veterinarian = await this.personRepository.findOne({ 
            where: { id: updateAppointmentDto.veterinarian_id } 
        });
        
        if (!veterinarian) {
            throw new NotFoundException(`Persona con ID ${updateAppointmentDto.veterinarian_id} no encontrada`);
        }

        if (veterinarian.role !== 'staff') {
            throw new BadRequestException(`La persona con ID ${updateAppointmentDto.veterinarian_id} no es un miembro del staff`);
        }
        }

        // Si se cambia la fecha, verificar disponibilidad del veterinario
        if (updateAppointmentDto.date && 
            updateAppointmentDto.date.toString() !== appointment.date.toString()) {
        const veterinarianId = updateAppointmentDto.veterinarian_id || appointment.veterinarian_id;
        const appointmentDate = new Date(updateAppointmentDto.date);
        const startTime = new Date(appointmentDate);
        const endTime = new Date(appointmentDate);
        endTime.setMinutes(appointmentDate.getMinutes() + 30);

        const existingAppointment = await this.appointmentRepository.findOne({
            where: {
            id: Not(id), // Excluir la cita actual
            veterinarian_id: veterinarianId,
            date: Between(startTime, endTime),
            status: 'programada'
            }
        });

        if (existingAppointment) {
            throw new ConflictException(`El veterinario ya tiene una cita programada en este horario`);
        }
        }

        // Actualizar los campos
        Object.assign(appointment, updateAppointmentDto);
        
        return this.appointmentRepository.save(appointment);
    }

    async complete(id: number, document?: string): Promise<Appointment> {
        const appointment = await this.findOne(id);
        
        if (appointment.status === 'completada') {
        throw new BadRequestException(`Esta cita ya está completada`);
        }

        if (appointment.status === 'cancelada') {
        throw new BadRequestException(`No se puede completar una cita cancelada`);
        }

        appointment.status = 'completada';
        if (document) {
        appointment.document = document;
        }
        
        return this.appointmentRepository.save(appointment);
    }

    async cancel(id: number): Promise<Appointment> {
        const appointment = await this.findOne(id);
        
        if (appointment.status === 'completada') {
        throw new BadRequestException(`No se puede cancelar una cita completada`);
        }

        if (appointment.status === 'cancelada') {
        throw new BadRequestException(`Esta cita ya está cancelada`);
        }

        appointment.status = 'cancelada';
        
        return this.appointmentRepository.save(appointment);
    }

    async remove(id: number): Promise<void> {
        const result = await this.appointmentRepository.delete(id);
        
        if (result.affected === 0) {
        throw new NotFoundException(`Cita con ID ${id} no encontrada`);
        }
    }
}