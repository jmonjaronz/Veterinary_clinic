import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { OpinionFilterDto } from './dto/opinion-medical-record-filter.dto';
import { OpinionResponseDto } from './dto/opinion-medical-records-response.dto';
import { UpdateOpinionDto } from './dto/update-opinion-medical-record.dto';
import { OpinionMedicalRecord } from './entities/opinion-medical-record.entity';
import { CreateOpinionDto } from './dto/create-opinion-medical-record.dto';

@Injectable()
export class OpinionService {
  constructor(
    @InjectRepository(OpinionMedicalRecord)
    private readonly opinionRepository: Repository<OpinionMedicalRecord>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
  ) {}

  async create(dto: CreateOpinionDto, loggedUser: any): Promise<OpinionResponseDto> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id: dto.medical_record_id },
    });
    if (!record) {
      throw new NotFoundException(
        `Registro médico con ID ${dto.medical_record_id} no encontrado`,
      );
    }

    const opinion = this.opinionRepository.create({
      ...dto,
      user_id: loggedUser.id,
    });

    const saved = await this.opinionRepository.save(opinion);
    return plainToInstance(OpinionResponseDto, saved, { excludeExtraneousValues: true });
  }

  async findAll(filter: OpinionFilterDto = new OpinionFilterDto()) {
    const {
      page = 1,
      per_page = 10,
      medical_record_id,
      pet_id,
      owner_id,
      user_id,
      date_start,
      date_end,
      comment_contains,
      observations_contains,
    } = filter;

    const query = this.opinionRepository
      .createQueryBuilder('opinion')
      .leftJoinAndSelect('opinion.medical_record', 'medical_record')
      .leftJoinAndSelect('opinion.pet', 'pet')
      .leftJoinAndSelect('opinion.owner', 'owner')
      .leftJoinAndSelect('opinion.user', 'user');

    if (medical_record_id) query.andWhere('opinion.medical_record_id = :medical_record_id', { medical_record_id });
    if (pet_id) query.andWhere('opinion.pet_id = :pet_id', { pet_id });
    if (owner_id) query.andWhere('opinion.owner_id = :owner_id', { owner_id });
    if (user_id) query.andWhere('opinion.user_id = :user_id', { user_id });

    if (date_start && date_end) {
      query.andWhere('opinion.created_at BETWEEN :start AND :end', { start: date_start, end: date_end });
    } else if (date_start) {
      query.andWhere('opinion.created_at >= :start', { start: date_start });
    } else if (date_end) {
      query.andWhere('opinion.created_at <= :end', { end: date_end });
    }

    if (comment_contains) {
      query.andWhere('opinion.comment LIKE :comment', { comment: `%${comment_contains}%` });
    }
    if (observations_contains) {
      query.andWhere('opinion.observations LIKE :obs', { obs: `%${observations_contains}%` });
    }

    const skip = (page - 1) * per_page;
    query.orderBy('opinion.created_at', 'DESC').skip(skip).take(per_page);

    const [data, total] = await query.getManyAndCount();
    const lastPage = Math.ceil(total / per_page);

    return {
      data: plainToInstance(OpinionResponseDto, data, { excludeExtraneousValues: true }),
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

  async findOne(id: number): Promise<OpinionResponseDto> {
    const opinion = await this.opinionRepository.findOne({
      where: { id },
      relations: ['medical_record', 'pet', 'owner', 'user'],
    });
    if (!opinion) throw new NotFoundException(`Opinión con ID ${id} no encontrada`);

    return plainToInstance(OpinionResponseDto, opinion, { excludeExtraneousValues: true });
  }

  async update(id: number, dto: UpdateOpinionDto): Promise<OpinionResponseDto> {
    const opinion = await this.opinionRepository.findOne({ where: { id } });
    if (!opinion) {
      throw new NotFoundException(`Opinión con ID ${id} no encontrada`);
    }

    Object.assign(opinion, dto);

    const saved = await this.opinionRepository.save(opinion);
    return plainToInstance(OpinionResponseDto, saved, { excludeExtraneousValues: true });
  }

  async remove(id: number): Promise<void> {
    const result = await this.opinionRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Opinión con ID ${id} no encontrada`);
    }
  }

  // 📌 Servicios adicionales de búsqueda por relaciones

  async findByMedicalRecord(id: number, filter?: OpinionFilterDto) {
    const record = await this.medicalRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Registro médico con ID ${id} no encontrado`);
    }

    return this.findAll(Object.assign(new OpinionFilterDto(), filter, { medical_record_id: id }));
  }

  async findByPet(id: number, filter?: OpinionFilterDto) {
    return this.findAll(Object.assign(new OpinionFilterDto(), filter, { pet_id: id }));
  }

  async findByOwner(id: number, filter?: OpinionFilterDto) {
    return this.findAll(Object.assign(new OpinionFilterDto(), filter, { owner_id: id }));
  }
}
