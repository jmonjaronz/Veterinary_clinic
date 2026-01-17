import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from './entities/treatment.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { TreatmentFilterDto } from './dto/treatment-filter.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
  ) {}

  async create(dto: CreateTreatmentDto): Promise<Treatment> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id: dto.medical_record_id },
    });
    if (!record)
      throw new NotFoundException(
        `Registro médico con ID ${dto.medical_record_id} no encontrado`,
      );

    const treatment = this.treatmentRepository.create({
      ...dto,
      medications: dto.medications,
    });
    return this.treatmentRepository.save(treatment);
  }

  async findAll(filter: TreatmentFilterDto = new TreatmentFilterDto()) {
    const {
      page = 1,
      per_page = 10,
      medical_record_id,
      medication,
      date_start,
      date_end,
      description_contains,
      dose_contains,
      frequency_contains,
      duration_contains,
      observations_contains,
    } = filter;

const query = this.treatmentRepository
  .createQueryBuilder('treatment')
  .leftJoinAndSelect('treatment.medical_record', 'medical_record')
  .leftJoinAndSelect('medical_record.pet', 'pet')
  .leftJoinAndSelect('pet.owner', 'owner')
  .leftJoinAndSelect('owner.person', 'person')
  .leftJoinAndSelect('medical_record.veterinarian', 'veterinarian')
  .leftJoinAndSelect('medical_record.opinions', 'opinions')
  .leftJoinAndSelect('opinions.user', 'user')
  .leftJoinAndSelect('user.person', 'person');

    if (medical_record_id)
      query.andWhere('treatment.medical_record_id = :medical_record_id', {
        medical_record_id,
      });
    if (typeof medication === 'boolean')
      query.andWhere('treatment.medication = :medication', { medication });
    if (date_start && date_end)
      query.andWhere('treatment.date BETWEEN :start AND :end', {
        start: date_start,
        end: date_end,
      });
    else if (date_start)
      query.andWhere('treatment.date >= :start', { start: date_start });
    else if (date_end)
      query.andWhere('treatment.date <= :end', { end: date_end });

    const likeFilters = {
      description_contains: 'description',
      dose_contains: 'dose',
      frequency_contains: 'frequency',
      duration_contains: 'duration',
      observations_contains: 'observations',
    };

    for (const [key, column] of Object.entries(likeFilters)) {
      const value = filter[key as keyof TreatmentFilterDto];
      if (value)
        query.andWhere(`treatment.${column} LIKE :${column}`, {
          [column]: `%${value}%`,
        });
    }

    const skip = (page - 1) * per_page;
    query.orderBy('treatment.date', 'DESC').skip(skip).take(per_page);

    const [data, total] = await query.getManyAndCount();
    const lastPage = Math.ceil(total / per_page);

    return {
      data,
      meta: {
        total,
        per_page,
        current_page: page,
        last_page: lastPage,
        from: skip + 1,
        to: skip + data.length,
      },
      links: {
        first: `?page=1&per_page=${per_page}`,
        last: `?page=${lastPage}&per_page=${per_page}`,
        prev: page > 1 ? `?page=${page - 1}&per_page=${per_page}` : null,
        next: page < lastPage ? `?page=${page + 1}&per_page=${per_page}` : null,
      },
    };
  }

  async findOne(id: number): Promise<Treatment> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
      relations: [
        'medical_record',
        'medical_record.pet',
        'medical_record.veterinarian',
      ],
    });
    if (!treatment)
      throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
    return treatment;
  }

  private async validateAndFilterByField(
    field: 'medical_record_id',
    id: number,
    filterDto?: Partial<TreatmentFilterDto>,
  ) {
    if (field === 'medical_record_id') {
      const exists = await this.medicalRecordRepository.exist({
        where: { id },
      });
      if (!exists)
        throw new NotFoundException(
          `Registro médico con ID ${id} no encontrado`,
        );
    }

    const filters = plainToInstance(TreatmentFilterDto, {
      ...(filterDto || {}),
      [field]: id,
    });

    return this.findAll(filters);
  }

  async findByMedicalRecord(id: number, dto?: TreatmentFilterDto) {
    return this.validateAndFilterByField('medical_record_id', id, dto);
  }

  async update(id: number, dto: UpdateTreatmentDto): Promise<Treatment> {
    const treatment = await this.findOne(id);

    if (!treatment) {
      throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
    }

    // Validar si cambia el registro médico
    if (
      dto.medical_record_id &&
      dto.medical_record_id !== treatment.medical_record_id
    ) {
      const record = await this.medicalRecordRepository.findOne({
        where: { id: dto.medical_record_id },
      });

      if (!record) {
        throw new NotFoundException(
          `Registro médico con ID ${dto.medical_record_id} no encontrado`,
        );
      }
    }

    // Asignar cambios básicos
    Object.assign(treatment, dto);

    // Si vienen medicamentos como array, procesarlos
    if (dto.medications) {
      // Asignar directamente el array de medicamentos
      treatment.medications = dto.medications;
    }

    return this.treatmentRepository.save(treatment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.treatmentRepository.softDelete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
  }
}
