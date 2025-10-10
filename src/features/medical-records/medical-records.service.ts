import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Hospitalization } from '../hospitalizations/entities/hospitalization.entity';
import { VaccinationRecord } from '../vaccination-plans/entities/vaccination-record.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordFilterDto } from './dto/medical-record-filter.dto';
import { PetCompleteHistoryDto } from './dto/pet-complete-history.dto';
import { plainToInstance } from 'class-transformer';
import { MedicalRecordResponseDto } from './dto/medical-record-response.dto';
import { fieldsToUpdate } from './entities/medical-record-update.entitiy';
import * as path from 'path';
import * as fs from 'fs';
import { TreatmentResponseDto } from '../treatments/dto/treatments-response.dto';

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
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
    @InjectRepository(Hospitalization)
    private readonly hospitalizationRepository: Repository<Hospitalization>,
    @InjectRepository(VaccinationRecord)
    private readonly vaccinationRecordRepository: Repository<VaccinationRecord>,
  ) {}

  async create(
    createMedicalRecordDto: CreateMedicalRecordDto,
    loggedUser: any,
  ): Promise<MedicalRecord> {
    const { pet_id, appointment_id, veterinarian_id, diagnosis, type } =
      createMedicalRecordDto;

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

    // Verificar si la cita existe si se proporciona
    if (appointment_id) {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointment_id },
      });
      if (!appointment) {
        throw new NotFoundException(
          `Cita con ID ${appointment_id} no encontrada`,
        );
      }

      // Verificar que la cita corresponde a la mascota y al veterinario
      if (appointment.pet_id !== pet_id) {
        throw new BadRequestException(
          `La cita con ID ${appointment_id} no corresponde a la mascota con ID ${pet_id}`,
        );
      }

      if (appointment.veterinarian_id !== veterinarian_id) {
        throw new BadRequestException(
          `La cita con ID ${appointment_id} no corresponde al veterinario con ID ${veterinarian_id}`,
        );
      }

      // Validar si la cita ya tiene atención
      if (appointment_id) {
        const existing = await this.medicalRecordRepository.findOne({
          where: { appointment_id },
        });

        if (existing) {
          throw new BadRequestException(
            'La cita ya tiene una atención registrada',
          );
        }
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
      type,

      lote: createMedicalRecordDto.lote,
      care_type: createMedicalRecordDto.care_type,
      date_next_application: createMedicalRecordDto.date_next_application,
      note_next_application: createMedicalRecordDto.note_next_application,
      appointment_date: createMedicalRecordDto.appointment_date, // string "2026-02-02"

      // CAMPOS DE ANÁLISIS CLÍNICO
      anamnesis: createMedicalRecordDto.anamnesis,
      weight: createMedicalRecordDto.weight,
      temperature: createMedicalRecordDto.temperature,
      heart_rate: createMedicalRecordDto.heart_rate,
      breathing_frequency: createMedicalRecordDto.breathing_frequency,
      capillary_refill_time: createMedicalRecordDto.capillary_refill_time,
      mucous: createMedicalRecordDto.mucous,

      // BOOLEANOS
      swallow_reflex: createMedicalRecordDto.swallow_reflex,
      cough_reflex: createMedicalRecordDto.cough_reflex,
      palmo_percussion: createMedicalRecordDto.palmo_percussion,

      // CAMPOS DE OBSERVACIÓN
      lymph_nodes: createMedicalRecordDto.lymph_nodes,
      consciousness_state: createMedicalRecordDto.consciousness_state,
      nutritional_state: createMedicalRecordDto.nutritional_state,
      hydration_state: createMedicalRecordDto.hydration_state,
      pain_level: createMedicalRecordDto.pain_level,
      itch_intensity: createMedicalRecordDto.itch_intensity,
      clinical_signs: createMedicalRecordDto.clinical_signs,
      blood_pressure: createMedicalRecordDto.blood_pressure,
      presumptive_diagnosis: createMedicalRecordDto.presumptive_diagnosis,
      recommended_tests: createMedicalRecordDto.recommended_tests,
      definitive_diagnosis: createMedicalRecordDto.definitive_diagnosis,
      diet: createMedicalRecordDto.diet,
      user_id: loggedUser.id,
    });

    return this.medicalRecordRepository.save(medicalRecord);
  }

  async findAll(filterDto?: MedicalRecordFilterDto) {
    // Usar un objeto por defecto si filterDto es undefined
    const filters = filterDto || new MedicalRecordFilterDto();

    // Definir tipos para la paginación
    const page: number = filters.page || 1;
    const perPage: number = filters.per_page || 10;

    // Crear QueryBuilder para consultas avanzadas
    const queryBuilder = this.medicalRecordRepository
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.pet', 'pet')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('mr.user', 'user')
      .leftJoinAndSelect('mr.opinions', 'opinions')
      .leftJoinAndSelect('mr.veterinarian', 'veterinarian')
      .leftJoinAndSelect('mr.treatments', 'treatments')
      .leftJoinAndSelect('mr.appointment', 'appointment');

    // Aplicar filtros básicos
    if (filters.pet_id) {
      queryBuilder.andWhere('mr.pet_id = :pet_id', { pet_id: filters.pet_id });
    }

    if (filters.veterinarian_id) {
      queryBuilder.andWhere('mr.veterinarian_id = :vet_id', {
        vet_id: filters.veterinarian_id,
      });
    }

    if (filters.appointment_id) {
      queryBuilder.andWhere('mr.appointment_id = :app_id', {
        app_id: filters.appointment_id,
      });
    }

    // Búsqueda de texto en campos de texto largo
    if (filters.diagnosis_contains) {
      queryBuilder.andWhere('mr.diagnosis LIKE :diagnosis', {
        diagnosis: `%${filters.diagnosis_contains}%`,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('UPPER(mr.type) LIKE :type', {
        type: `%${filters.type.toUpperCase()}%`,
      });
    }

    if (filters.treatment_contains) {
      queryBuilder.andWhere('mr.treatment LIKE :treatment', {
        treatment: `%${filters.treatment_contains}%`,
      });
    }

    if (filters.prescriptions_contains) {
      queryBuilder.andWhere('mr.prescriptions LIKE :prescriptions', {
        prescriptions: `%${filters.prescriptions_contains}%`,
      });
    }

    // Filtros de rango para fecha de cita médica
    if (filters.appointment_date_start && filters.appointment_date_end) {
      queryBuilder.andWhere('mr.appointment_date BETWEEN :start AND :end', {
        start: filters.appointment_date_start,
        end: filters.appointment_date_end,
      });
    } else if (filters.appointment_date_start) {
      queryBuilder.andWhere('mr.appointment_date >= :start', {
        start: filters.appointment_date_start,
      });
    } else if (filters.appointment_date_end) {
      queryBuilder.andWhere('mr.appointment_date <= :end', {
        end: filters.appointment_date_end,
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
    const skip = (page - 1) * perPage;

    // Aplicar paginación y ordenamiento
    queryBuilder
      .orderBy('mr.appointment_date', 'DESC')
      .skip(skip)
      .take(perPage);

    // Ejecutar la consulta
    const [rawData, total] = await queryBuilder.getManyAndCount();

    // Transformar los datos a DTO
    const data = plainToInstance(MedicalRecordResponseDto, rawData, {
      excludeExtraneousValues: true,
    });

    // Calcular metadatos de paginación
    const lastPage = Math.ceil(total / perPage);

    return {
      data,
      meta: {
        total,
        per_page: perPage,
        current_page: page,
        last_page: lastPage,
        from: skip + 1,
        to: skip + data.length,
      },
      links: {
        first: `?page=1&per_page=${perPage}`,
        last: `?page=${lastPage}&per_page=${perPage}`,
        prev: page > 1 ? `?page=${page - 1}&per_page=${perPage}` : null,
        next: page < lastPage ? `?page=${page + 1}&per_page=${perPage}` : null,
      },
    };
  }

  async findOne(id: number): Promise<MedicalRecord> {
    const medicalRecord = await this.medicalRecordRepository.findOne({
      where: { id },
      relations: [
        'pet',
        'user',
        'pet.owner',
        'veterinarian',
        'appointment',
        'opinions',
        'treatments',
      ],
    });

    if (!medicalRecord) {
      throw new NotFoundException(`Registro médico con ID ${id} no encontrado`);
    }

    return medicalRecord;
  }

  async findByPet(
    petId: number,
    filterDto?: MedicalRecordFilterDto,
  ): Promise<any> {
    // Verificar si la mascota existe
    const pet = await this.petRepository.findOne({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    // Crear una copia del filtro o uno nuevo si no hay
    const filters = new MedicalRecordFilterDto();
    if (filterDto) {
      Object.assign(filters, filterDto);
    }

    // Establecer el ID de la mascota en los filtros
    filters.pet_id = petId;

    // Usar el método findAll con los filtros
    return this.findAll(filters);
  }

  async findByVeterinarian(
    veterinarianId: number,
    filterDto?: MedicalRecordFilterDto,
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
    const filters = new MedicalRecordFilterDto();
    if (filterDto) {
      Object.assign(filters, filterDto);
    }

    // Establecer el ID del veterinario en los filtros
    filters.veterinarian_id = veterinarianId;

    // Usar el método findAll con los filtros
    return this.findAll(filters);
  }

  async findByAppointment(
    appointmentId: number,
    filterDto?: MedicalRecordFilterDto,
  ): Promise<any> {
    // Verificar si la cita existe
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${appointmentId} no encontrada`);
    }

    // Crear una copia del filtro o uno nuevo si no hay
    const filters = new MedicalRecordFilterDto();
    if (filterDto) {
      Object.assign(filters, filterDto);
    }

    // Establecer el ID de la cita en los filtros
    filters.appointment_id = appointmentId;

    // Usar el método findAll con los filtros
    return this.findAll(filters);
  }

  async update(
    id: number,
    updateMedicalRecordDto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecord> {
    const medicalRecord = await this.findOne(id);

    // Validación: Cambio de mascota
    if (
      updateMedicalRecordDto.pet_id &&
      updateMedicalRecordDto.pet_id !== medicalRecord.pet_id
    ) {
      const pet = await this.petRepository.findOne({
        where: { id: updateMedicalRecordDto.pet_id },
      });

      if (!pet) {
        throw new NotFoundException(
          `Mascota con ID ${updateMedicalRecordDto.pet_id} no encontrada`,
        );
      }

      medicalRecord.pet_id = updateMedicalRecordDto.pet_id;
    }

    // Validación: Cambio de veterinario
    if (
      updateMedicalRecordDto.veterinarian_id &&
      updateMedicalRecordDto.veterinarian_id !== medicalRecord.veterinarian_id
    ) {
      const veterinarian = await this.personRepository.findOne({
        where: { id: updateMedicalRecordDto.veterinarian_id },
      });

      if (!veterinarian) {
        throw new NotFoundException(
          `Persona con ID ${updateMedicalRecordDto.veterinarian_id} no encontrada`,
        );
      }

      if (veterinarian.role !== 'staff') {
        throw new BadRequestException(
          `La persona con ID ${updateMedicalRecordDto.veterinarian_id} no es un miembro del staff`,
        );
      }

      medicalRecord.veterinarian_id = updateMedicalRecordDto.veterinarian_id;
    }

    // Validación: Cambio de cita
    if (
      updateMedicalRecordDto.appointment_id &&
      updateMedicalRecordDto.appointment_id !== medicalRecord.appointment_id
    ) {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: updateMedicalRecordDto.appointment_id },
      });

      if (!appointment) {
        throw new NotFoundException(
          `Cita con ID ${updateMedicalRecordDto.appointment_id} no encontrada`,
        );
      }

      const petId = updateMedicalRecordDto.pet_id || medicalRecord.pet_id;
      const veterinarianId =
        updateMedicalRecordDto.veterinarian_id || medicalRecord.veterinarian_id;

      if (appointment.pet_id !== petId) {
        throw new BadRequestException(
          `La cita con ID ${updateMedicalRecordDto.appointment_id} no corresponde a la mascota con ID ${petId}`,
        );
      }

      if (appointment.veterinarian_id !== veterinarianId) {
        throw new BadRequestException(
          `La cita con ID ${updateMedicalRecordDto.appointment_id} no corresponde al veterinario con ID ${veterinarianId}`,
        );
      }

      if (appointment.status !== 'completada') {
        appointment.status = 'completada';
        await this.appointmentRepository.save(appointment);
      }

      medicalRecord.appointment_id = updateMedicalRecordDto.appointment_id;
    }

    // Asignar otros campos si existen en el DTO (solo si vienen)

    for (const field of fieldsToUpdate) {
      if (
        field in updateMedicalRecordDto &&
        updateMedicalRecordDto[field] !== undefined
      ) {
        medicalRecord[field] = updateMedicalRecordDto[field];
      }
    }

    return this.medicalRecordRepository.save(medicalRecord);
  }

  async remove(id: number): Promise<void> {
    const result = await this.medicalRecordRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Registro médico con ID ${id} no encontrado`);
    }
  }

  private normalizeDate(date: Date, endOfDay = false): Date {
    const d = new Date(date);
    if (endOfDay) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }

  async getPetCompleteHistory(
    petId: number,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<PetCompleteHistoryDto> {
    // ==== Fechas por defecto ====
    const now = new Date();
    const defaultStart = this.normalizeDate(new Date(2024, 0, 1));
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultEnd = this.normalizeDate(tomorrow, true);

    const inicio = fechaInicio
      ? this.normalizeDate(new Date(fechaInicio))
      : defaultStart;
    const fin = fechaFin
      ? this.normalizeDate(new Date(fechaFin), true)
      : defaultEnd;

    // ==== Verificar mascota ====
    const pet = await this.petRepository.findOne({
      where: { id: petId },
      relations: ['owner', 'species'],
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    // ==== Registros médicos ====
    const medicalRecords = await this.medicalRecordRepository.find({
      where: {
        pet_id: petId,
        appointment_date: Between(
          inicio.toISOString().split('T')[0],
          fin.toISOString().split('T')[0],
        ),
      },
      relations: [
        'veterinarian',
        'appointment',
        'treatments',
        'opinions',
        'opinions.user',
        'opinions.user.person',
        'pet',
        'pet.owner',
        'user',
      ],
      order: { appointment_date: 'DESC' },
    });

    const medicalRecordsResponse = plainToInstance(
      MedicalRecordResponseDto,
      medicalRecords,
      { excludeExtraneousValues: true },
    );

    // ==== Citas ====
    const appointments = await this.appointmentRepository.find({
      where: { pet_id: petId, date: Between(inicio, fin) },
      relations: ['veterinarian'],
      order: { date: 'DESC' },
    });

    // ==== Hospitalizaciones ====
    const hospitalizations = await this.hospitalizationRepository.find({
      where: { pet_id: petId, admission_date: Between(inicio, fin) },
      relations: ['veterinarian'],
      order: { admission_date: 'DESC' },
    });

    // ==== Tratamientos ====
    const treatmentsRaw = await this.treatmentRepository
      .createQueryBuilder('treatment')
      .innerJoin('treatment.medical_record', 'mr')
      .where('mr.pet_id = :petId', { petId })
      .andWhere('treatment.date BETWEEN :inicio AND :fin', { inicio, fin })
      .leftJoinAndSelect('treatment.medical_record', 'medical_record')
      .leftJoinAndSelect('medical_record.veterinarian', 'veterinarian')
      .orderBy('treatment.date', 'DESC')
      .getMany();

    const treatmentsResponse = plainToInstance(
      TreatmentResponseDto,
      treatmentsRaw,
      { excludeExtraneousValues: true },
    );

    // ==== Vacunaciones ====
    const vaccinations = await this.vaccinationRecordRepository
      .createQueryBuilder('vr')
      .innerJoin('vr.vaccination_plan', 'vp')
      .innerJoin('vp.pet', 'pet')
      .where('pet.id = :petId', { petId })
      .andWhere('vr.status = :status', { status: 'completado' })
      .andWhere('vr.created_at BETWEEN :inicio AND :fin', { inicio, fin })
      .leftJoinAndSelect('vr.vaccine', 'vaccine')
      .leftJoinAndSelect('vr.vaccination_plan', 'plan')
      .orderBy('vr.administered_date', 'DESC')
      .getMany();

    // ==== Timeline ====
    const timeline = this.createTimelineFromRecords(
      medicalRecordsResponse,
      appointments,
      hospitalizations,
      treatmentsResponse,
      vaccinations,
      inicio,
      fin,
    );

    // ==== Retorno final ====
    const petHistory: PetCompleteHistoryDto = {
      medical_records: medicalRecordsResponse,
      appointments,
      hospitalizations,
      treatments: treatmentsResponse,
      vaccinations,
      pet_info: {
        id: pet.id,
        name: pet.name,
        species: pet.species.name,
        breed: pet.breed,
        age: pet.age,
        owner_name: pet.owner.full_name,
      },
      timeline,
    };

    return petHistory;
  }

  private createTimelineFromRecords(
    medicalRecords: MedicalRecordResponseDto[],
    appointments: Appointment[],
    hospitalizations: Hospitalization[],
    treatments: TreatmentResponseDto[],
    vaccinations: VaccinationRecord[],
    inicio: Date,
    fin: Date,
  ): PetCompleteHistoryDto['timeline'] {
    const timeline: PetCompleteHistoryDto['timeline'] = [];

    const inRange = (date: Date | string | null | undefined): boolean => {
      if (!date) return false;
      const d = new Date(date);
      return d >= inicio && d <= fin;
    };

    // === Registros médicos + Opiniones ===
    medicalRecords.forEach((record) => {
      if (record.appointment_date && inRange(record.appointment_date)) {
        timeline.push({
          id: `mr_${record.id}`,
          type: 'medical_record',
          date: new Date(record.appointment_date),
          description: `Diagnóstico: ${record.diagnosis || 'Sin diagnóstico'}`,
          veterinarian: record.veterinarian?.full_name,
        });
      }

      // Opiniones asociadas al registro
      if (record.opinions?.length) {
        record.opinions.forEach((opinion) => {
          if (inRange(opinion.created_at)) {
            const petName = record.pet?.name ?? 'Sin nombre';
            const ownerName = record.pet?.owner?.full_name ?? 'Sin propietario';
            const userName =
              opinion.user?.person?.full_name ?? 'Usuario no especificado';

            timeline.push({
              id: `opn_${opinion.id}`,
              type: 'opinion',
              date: new Date(opinion.created_at),
              description:
                `Opinión: ${opinion.comment || 'Sin comentario'}` +
                `\nMascota: ${petName}` +
                `\nPropietario: ${ownerName}`,
              veterinarian: userName,
            });
          }
        });
      }
    });

    // === Citas ===
    appointments.forEach((appointment) => {
      if (appointment.date && inRange(appointment.date)) {
        timeline.push({
          id: `app_${appointment.id}`,
          type: 'appointment',
          date: new Date(appointment.date),
          description: `Cita ${appointment.appointment_type}`,
          veterinarian: appointment.veterinarian?.full_name,
          status: appointment.status,
        });
      }
    });

    // === Hospitalizaciones ===
    hospitalizations.forEach((hospitalization) => {
      if (
        hospitalization.admission_date &&
        inRange(hospitalization.admission_date)
      ) {
        timeline.push({
          id: `hosp_${hospitalization.id}`,
          type: 'hospitalization',
          date: new Date(hospitalization.admission_date),
          description: `Hospitalización: ${hospitalization.reason || 'Sin motivo'}`,
          veterinarian: hospitalization.veterinarian?.full_name,
          status: hospitalization.discharge_date ? 'Alta' : 'En curso',
        });
      }
    });

    // === Tratamientos ===
    treatments.forEach((treatment) => {
      if (treatment.date && inRange(treatment.date)) {
        timeline.push({
          id: `treat_${treatment.id}`,
          type: 'treatment',
          date: new Date(treatment.date),
          description: `Tratamiento: ${treatment.description || 'Sin descripción'}`,
          veterinarian: treatment.medical_record?.veterinarian?.full_name,
        });
      }
    });

    // === Vacunas ===
    vaccinations.forEach((vaccination) => {
      if (vaccination.created_at && inRange(vaccination.created_at)) {
        timeline.push({
          id: `vac_${vaccination.id}`,
          type: 'vaccination',
          date: new Date(vaccination.created_at),
          description: `Vacuna aplicada: ${
            vaccination.vaccine?.name || 'Vacuna'
          }`,
          status: vaccination.status,
        });
      }
    });

    // === Ordenar del más reciente al más antiguo ===
    return timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  async saveFiles(id: number, newFilePaths: string[]): Promise<MedicalRecord> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('Registro médico no encontrado');
    }

    const existingFiles = record.route_files
      ? record.route_files.split(',')
      : [];

    // Concatenar los nuevos archivos
    const updatedFiles = [...existingFiles, ...newFilePaths];
    record.route_files = updatedFiles.join(',');

    return await this.medicalRecordRepository.save(record);
  }

  async removeFile(id: number, filePath: string): Promise<MedicalRecord> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('Registro médico no encontrado');
    }

    // Archivos guardados (con rutas relativas o absolutas)
    const files = record.route_files ? record.route_files.split(',') : [];

    // Tomamos siempre el basename (ej: "archivo.pdf")
    const baseNameToDelete = path.basename(filePath);

    // Buscar coincidencia (ruta completa, normalizada o solo nombre)
    const fileToDelete = files.find(
      (f) =>
        f === filePath ||
        path.normalize(f) === path.normalize(filePath) ||
        path.basename(f) === baseNameToDelete,
    );

    if (!fileToDelete) {
      throw new NotFoundException(
        `El archivo ${filePath} no está registrado en este expediente`,
      );
    }

    // Construir ruta absoluta real
    const fullPath = path.isAbsolute(fileToDelete)
      ? fileToDelete
      : path.join(process.cwd(), fileToDelete);

    // Verificar si existe en disco y eliminar
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    } else {
      console.warn(`⚠️ Archivo no encontrado en disco: ${fullPath}`);
    }

    // Actualizar BD quitando el archivo eliminado
    const updatedFiles = files.filter(
      (f) =>
        f !== filePath &&
        path.normalize(f) !== path.normalize(filePath) &&
        path.basename(f) !== baseNameToDelete,
    );
    record.route_files = updatedFiles.join(',');

    return await this.medicalRecordRepository.save(record);
  }
}
