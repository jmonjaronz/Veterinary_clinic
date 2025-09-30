import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';

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

  async create(
    createAppointmentDto: CreateAppointmentDto,
    loggedUser: any, // o mejor: User si tienes el tipo importado
  ): Promise<Appointment> {
    const { pet_id, veterinarian_id, appointment_type, date } =
      createAppointmentDto;

    // Verificar si la mascota existe
    const pet = await this.petRepository.findOne({ where: { id: pet_id } });
    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
    }

    // Verificar si el veterinario existe y es staff
    const veterinarian = await this.personRepository.findOne({
      where: { id: veterinarian_id },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Persona con ID ${veterinarian_id} no encontrada`,
      );
    }

    if (veterinarian.role !== 'staff') {
      throw new BadRequestException(
        `La persona con ID ${veterinarian_id} no es un miembro del staff`,
      );
    }

    // Verificar disponibilidad del veterinario
    const appointmentDate = new Date(date);
    const startTime = new Date(appointmentDate);
    const endTime = new Date(appointmentDate);
    endTime.setMinutes(appointmentDate.getMinutes() + 30); // Asumimos citas de 30 minutos

    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        veterinarian_id,
        date: Between(startTime, endTime),
        status: 'programada',
      },
    });

    if (existingAppointment) {
      throw new ConflictException(
        `El veterinario ya tiene una cita programada en este horario`,
      );
    }

    // Buscar último correlativo (el numérico más alto) y aumentar en uno
    const lastAppointment = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .orderBy('appointment.id', 'DESC')
      .limit(1)
      .getOne();

    let nextCorrelative = '00000001'; // valor inicial

    if (lastAppointment?.correlative) {
      const lastNumber = parseInt(lastAppointment.correlative, 10);
      nextCorrelative = (lastNumber + 1).toString().padStart(8, '0');
    }
    console.log(loggedUser);

    // Crear la cita
    const appointment = this.appointmentRepository.create({
      pet_id,
      veterinarian_id,
      appointment_type,
      type: createAppointmentDto.type || '',
      date: appointmentDate,
      status: createAppointmentDto.status || 'programada',
      document: createAppointmentDto.document,
      user_id: loggedUser.id,
      correlative: nextCorrelative,
    });
    console.log(appointment);

    return this.appointmentRepository.save(appointment);
  }

  async findAll(filterDto?: AppointmentFilterDto) {
    // Usar un objeto por defecto si filterDto es undefined
    const filters = filterDto || new AppointmentFilterDto();

    // Crear QueryBuilder para consultas avanzadas
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian');

    // Aplicar filtros básicos de cita
    if (filters.pet_id) {
      queryBuilder.andWhere('appointment.pet_id = :pet_id', {
        pet_id: filters.pet_id,
      });
    }

    if (filters.veterinarian_id) {
      queryBuilder.andWhere('appointment.veterinarian_id = :vet_id', {
        vet_id: filters.veterinarian_id,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status: filters.status,
      });
    }

    if (filters.appointment_type) {
      queryBuilder.andWhere('appointment.appointment_type = :type', {
        type: filters.appointment_type,
      });
    }

    // Filtros de rango para fechas
    if (filters.date_start && filters.date_end) {
      queryBuilder.andWhere('appointment.date BETWEEN :start AND :end', {
        start: filters.date_start,
        end: filters.date_end,
      });
    } else if (filters.date_start) {
      queryBuilder.andWhere('appointment.date >= :start', {
        start: filters.date_start,
      });
    } else if (filters.date_end) {
      queryBuilder.andWhere('appointment.date <= :end', {
        end: filters.date_end,
      });
    }

    // Filtros para la mascota relacionada
    if (filters.pet_name) {
      queryBuilder.andWhere('pet.name LIKE :pet_name', {
        pet_name: `%${filters.pet_name}%`,
      });
    }

    if (filters.owner_id) {
      queryBuilder.andWhere('pet.owner_id = :owner_id', {
        owner_id: filters.owner_id,
      });
    }

    if (filters.owner_name) {
      queryBuilder.andWhere('owner.full_name LIKE :owner_name', {
        owner_name: `%${filters.owner_name}%`,
      });
    }

    // Filtros para el veterinario
    if (filters.veterinarian_name) {
      queryBuilder.andWhere('veterinarian.full_name LIKE :vet_name', {
        vet_name: `%${filters.veterinarian_name}%`,
      });
    }

    // Calcular skip para paginación
    const skip = (filters.page - 1) * filters.per_page;

    // Aplicar paginación y ordenamiento
    queryBuilder
      .orderBy('appointment.date', 'DESC')
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
        prev:
          filters.page > 1
            ? `?page=${filters.page - 1}&per_page=${filters.per_page}`
            : null,
        next:
          filters.page < lastPage
            ? `?page=${filters.page + 1}&per_page=${filters.per_page}`
            : null,
      },
    };
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

  async findByPet(
    petId: number,
    filterDto?: AppointmentFilterDto,
  ): Promise<any> {
    // Verificar si la mascota existe
    const pet = await this.petRepository.findOne({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer el ID de la mascota en los filtros
    filters.pet_id = petId;

    // Usar el método findAll con los filtros
    return this.findAll(filters);
  }

  async findByVeterinarian(
    veterinarianId: number,
    filterDto?: AppointmentFilterDto,
  ): Promise<any> {
    // Verificar si el veterinario existe
    const veterinarian = await this.personRepository.findOne({
      where: { id: veterinarianId },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Persona con ID ${veterinarianId} no encontrada`,
      );
    }

    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer el ID del veterinario en los filtros
    filters.veterinarian_id = veterinarianId;

    // Usar el método findAll con los filtros
    return this.findAll(filters);
  }

  async findUpcoming(filterDto?: AppointmentFilterDto): Promise<any> {
    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer filtros para citas próximas
    filters.date_start = new Date();
    filters.status = 'programada';

    // Usar el método findAll con los filtros, pero con un ordenamiento personalizado
    const result = await this.findAll(filters);

    // El ordenamiento para citas próximas debe ser ASC por fecha
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .where('appointment.date >= :now', { now: new Date() })
      .andWhere('appointment.status = :status', { status: 'programada' });

    // Aplicar filtros adicionales si existen
    if (filters.pet_id) {
      queryBuilder.andWhere('appointment.pet_id = :pet_id', {
        pet_id: filters.pet_id,
      });
    }

    if (filters.veterinarian_id) {
      queryBuilder.andWhere('appointment.veterinarian_id = :vet_id', {
        vet_id: filters.veterinarian_id,
      });
    }

    if (filters.appointment_type) {
      queryBuilder.andWhere('appointment.appointment_type = :type', {
        type: filters.appointment_type,
      });
    }

    // Aplicar los filtros de relaciones si existen
    if (filters.pet_name) {
      queryBuilder.andWhere('pet.name LIKE :pet_name', {
        pet_name: `%${filters.pet_name}%`,
      });
    }

    // Calcular skip para paginación
    const skip = (filters.page - 1) * filters.per_page;

    // Aplicar paginación y ordenamiento ASC por fecha
    queryBuilder
      .orderBy('appointment.date', 'ASC')
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
        prev:
          filters.page > 1
            ? `?page=${filters.page - 1}&per_page=${filters.per_page}`
            : null,
        next:
          filters.page < lastPage
            ? `?page=${filters.page + 1}&per_page=${filters.per_page}`
            : null,
      },
    };
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filterDto?: AppointmentFilterDto,
  ): Promise<any> {
    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer el rango de fechas en los filtros
    filters.date_start = startDate;
    filters.date_end = endDate;

    // Usar el método findAll con los filtros
    return this.findAll(filters);
  }

  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // Si se intenta cambiar la mascota, verificar que exista
    if (
      updateAppointmentDto.pet_id &&
      updateAppointmentDto.pet_id !== appointment.pet_id
    ) {
      const pet = await this.petRepository.findOne({
        where: { id: updateAppointmentDto.pet_id },
      });

      if (!pet) {
        throw new NotFoundException(
          `Mascota con ID ${updateAppointmentDto.pet_id} no encontrada`,
        );
      }
    }

    // Si se intenta cambiar el veterinario, verificar que exista y sea staff
    if (
      updateAppointmentDto.veterinarian_id &&
      updateAppointmentDto.veterinarian_id !== appointment.veterinarian_id
    ) {
      const veterinarian = await this.personRepository.findOne({
        where: { id: updateAppointmentDto.veterinarian_id },
      });

      if (!veterinarian) {
        throw new NotFoundException(
          `Persona con ID ${updateAppointmentDto.veterinarian_id} no encontrada`,
        );
      }

      if (veterinarian.role !== 'staff') {
        throw new BadRequestException(
          `La persona con ID ${updateAppointmentDto.veterinarian_id} no es un miembro del staff`,
        );
      }
    }

    // Si se cambia la fecha, verificar disponibilidad del veterinario
    if (
      updateAppointmentDto.date &&
      updateAppointmentDto.date.toString() !== appointment.date.toString()
    ) {
      const veterinarianId =
        updateAppointmentDto.veterinarian_id || appointment.veterinarian_id;
      const appointmentDate = new Date(updateAppointmentDto.date);
      const startTime = new Date(appointmentDate);
      const endTime = new Date(appointmentDate);
      endTime.setMinutes(appointmentDate.getMinutes() + 30);

      const existingAppointment = await this.appointmentRepository.findOne({
        where: {
          id: Not(id), // Excluir la cita actual
          veterinarian_id: veterinarianId,
          date: Between(startTime, endTime),
          status: 'programada',
        },
      });

      if (existingAppointment) {
        throw new ConflictException(
          `El veterinario ya tiene una cita programada en este horario`,
        );
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
    const result = await this.appointmentRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }
  }

  async findAppointmentsWithoutMedicalRecord(
    correlative?: string,
    appointment_type?: string,
  ): Promise<Appointment[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('medical_records', 'mr', 'mr.appointment_id = appointment.id')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .where('mr.id IS NULL'); // Solo las que no tienen atención

    if (correlative) {
      query.andWhere('UPPER(appointment.correlative) LIKE :correlative', {
        correlative: `%${correlative.toUpperCase()}%`,
      });
    }

    if (appointment_type) {
      query.andWhere(
        'UPPER(appointment.appointment_type) LIKE :appointment_type',
        {
          appointment_type: `%${appointment_type.toUpperCase()}%`,
        },
      );
    }

    return query.orderBy('appointment.id', 'DESC').limit(50).getMany();
  }
}
