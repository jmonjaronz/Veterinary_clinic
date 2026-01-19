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
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { User } from '../users/entities/user.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    loggedUser: User, // o mejor: User si tienes el tipo importado
  ): Promise<Appointment> {
    const { pet_id, veterinarian_id, appointment_type, date } =
      createAppointmentDto;

    // Verificar si la mascota existe
    const pet = await this.petRepository.findOne({ where: { id: pet_id } });
    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
    }

    // Verificar si el veterinario existe y es staff
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { personId: veterinarian_id, companyId: loggedUser.companyId },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Veterinario con ID ${veterinarian_id} no encontrado`,
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
        companyId: loggedUser.companyId
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
      .where('appointment.companyId = :company_id', { company_id: loggedUser.companyId })
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
      companyId: loggedUser.companyId,
    });
    console.log(appointment);

    return this.appointmentRepository.save(appointment);
  }

  async findAll(companyId: number, filterDto?: AppointmentFilterDto) {
    // Usar un objeto por defecto si filterDto es undefined
    const filters = filterDto || new AppointmentFilterDto();

    // Crear QueryBuilder para consultas avanzadas
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('owner.person', 'owner_person')
      .withDeleted()
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .leftJoinAndSelect('veterinarian.person', 'veterinarian_person');

    // Filtro empresa
    queryBuilder.where('appointment.companyId = :company_id', { company_id: companyId });

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
      queryBuilder.andWhere('pet.name ILIKE :pet_name', {
        pet_name: `%${filters.pet_name}%`,
      });
    }

    if (filters.owner_id) {
      queryBuilder.andWhere('pet.owner_id = :owner_id', {
        owner_id: filters.owner_id,
      });
    }

    if (filters.owner_name) {
      queryBuilder.andWhere('owner_person.full_name ILIKE :owner_name', {
        owner_name: `%${filters.owner_name}%`,
      });
    }

    // Filtros para el veterinario
    if (filters.veterinarian_name) {
      queryBuilder.andWhere('veterinarian_person.full_name ILIKE :vet_name', {
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

  async findOne(id: number, companyId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('owner.person', 'owner_person')
      .withDeleted()
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .addSelect(['veterinarian.licenceNumber', 'veterinarian.createdAt', 'veterinarian.updatedAt', 'veterinarian.deletedAt'])
      .leftJoinAndSelect('veterinarian.person', 'veterinarian_person')
      .where('appointment.id = :id', { id })
      .andWhere('appointment.companyId = :company_id', { company_id: companyId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    return appointment;
  }

  async findByPet(
    petId: number,
    companyId: number,
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
    return this.findAll(companyId, filters);
  }

  async findByVeterinarian(
    veterinarianId: number,
    companyId: number,
    filterDto?: AppointmentFilterDto,
  ): Promise<any> {
    // Verificar si el veterinario existe
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { personId: veterinarianId },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Veterinario con ID ${veterinarianId} no encontrado`,
      );
    }

    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer el ID del veterinario en los filtros
    filters.veterinarian_id = veterinarianId;

    // Usar el método findAll con los filtros
    return this.findAll(companyId, filters);
  }

  async findByVeterinarianDateRange(
    veterinarianId: number,
    startDate: Date,
    endDate: Date,
    companyId: number,
    filterDto?: AppointmentFilterDto,
  ): Promise<any> {
    // Verificar si el veterinario existe
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { personId: veterinarianId },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Veterinario con ID ${veterinarianId} no encontrado`,
      );
    }

    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer el ID del veterinario en los filtros
    filters.veterinarian_id = veterinarianId;

    // Establecer el rango de fechas en los filtros
    filters.date_start = startDate;
    filters.date_end = endDate;

    // Usar el método findAll con los filtros
    return this.findAll(companyId, filters);
  }

  async findUpcoming(companyId: number, filterDto?: AppointmentFilterDto): Promise<any> {
    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer filtros para citas próximas
    filters.date_start = new Date();
    filters.status = 'programada';

    // Usar el método findAll con los filtros, pero con un ordenamiento personalizado
    //const result = await this.findAll(companyId, filters);

    // El ordenamiento para citas próximas debe ser ASC por fecha
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('owner.person', 'owner_person')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .leftJoinAndSelect('veterinarian.person', 'veterinarian_person')
      .where('appointment.companyId = :company_id', {company_id: companyId})
      .andWhere('appointment.date >= :now', { now: new Date() })
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
      queryBuilder.andWhere('pet.name ILIKE :pet_name', {
        pet_name: `%${filters.pet_name}%`,
      });
    }

    queryBuilder.andWhere('user.company_id = :company_id', { company_id: companyId });

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
    startDate: Date | string,
    endDate: Date | string,
    companyId: number,
    filterDto?: AppointmentFilterDto,
  ): Promise<any> {
    // Crear una copia del filtro o uno nuevo si no hay
    const filters = filterDto ? { ...filterDto } : new AppointmentFilterDto();

    // Establecer el rango de fechas en los filtros
    filters.date_start = startDate;
    filters.date_end = endDate;

    // Usar el método findAll con los filtros
    return this.findAll(companyId, filters);
  }

  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    companyId: number
  ): Promise<Appointment> {
    const appointment = await this.findOne(id, companyId);

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

    // Si se intenta cambiar el veterinario, verificar que exista
    if (
      updateAppointmentDto.veterinarian_id &&
      updateAppointmentDto.veterinarian_id !== appointment.veterinarian_id
    ) {
      const veterinarian = await this.veterinarianRepository.findOne({
        where: { personId: updateAppointmentDto.veterinarian_id, companyId },
      });

      if (!veterinarian) {
        throw new NotFoundException(
          `Veterinario con ID ${updateAppointmentDto.veterinarian_id} no encontrado`,
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
          companyId
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

  async complete(id: number, companyId:number, document?: string): Promise<Appointment> {
    const appointment = await this.findOne(id, companyId);

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

  async cancel(id: number, companyId: number): Promise<Appointment> {
    const appointment = await this.findOne(id, companyId);

    if (appointment.status === 'completada') {
      throw new BadRequestException(`No se puede cancelar una cita completada`);
    }

    if (appointment.status === 'cancelada') {
      throw new BadRequestException(`Esta cita ya está cancelada`);
    }

    appointment.status = 'cancelada';

    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const result = await this.appointmentRepository.softDelete({id, companyId});
    if(result.affected === 0) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }
  }

  async findAppointmentsWithoutMedicalRecord(
    companyId: number,
    correlative?: string,
    appointment_type?: string,
  ): Promise<Appointment[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('medical_records', 'mr', 'mr.appointment_id = appointment.id')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .leftJoinAndSelect('appointment.user', 'user')
      .where('mr.id IS NULL'); // Solo las que no tienen atención
    
    // Filtro empresa
    query.andWhere('appointment.companyId = :company_id', { company_id: companyId });

    if (correlative) {
      query.andWhere('UPPER(appointment.correlative) ILIKE :correlative', {
        correlative: `%${correlative.toUpperCase()}%`,
      });
    }

    if (appointment_type) {
      query.andWhere(
        'UPPER(appointment.appointment_type) ILIKE :appointment_type',
        {
          appointment_type: `%${appointment_type.toUpperCase()}%`,
        },
      );
    }

    return query.orderBy('appointment.id', 'DESC').limit(50).getMany();
  }
}
