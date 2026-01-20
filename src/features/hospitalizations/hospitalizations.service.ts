import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Hospitalization } from './entities/hospitalization.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CreateHospitalizationDto } from './dto/create-hospitalization.dto';
import { UpdateHospitalizationDto } from './dto/update-hospitalization.dto';
import { HospitalizationFilterDto } from './dto/hospitalization-filter.dto';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/entities/user.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';

@Injectable()
export class HospitalizationsService {
  constructor(
    @InjectRepository(Hospitalization)
    private readonly hospitalizationRepository: Repository<Hospitalization>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
  ) {}

  async create(
    createHospitalizationDto: CreateHospitalizationDto,
    loggedUser: User,
  ): Promise<Hospitalization> {
    const { pet_id, veterinarian_id, reason, description, admission_date } =
      createHospitalizationDto;

    // Verificar si la mascot_a existe
    const pet = await this.petRepository.findOne({ where: { id: pet_id } });
    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
    }

    // Verificar si el veterinario existe
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { personId: veterinarian_id, companyId: loggedUser.companyId },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Veterinario con ID ${veterinarian_id} no encontrado`,
      );
    }

    // Verificar si la mascota ya está hospitalizada (no tiene fecha de alta)
    const activeHospitalization = await this.hospitalizationRepository.findOne({
      where: {
        pet_id,
        discharge_date: IsNull(),
        companyId: loggedUser.companyId,
      },
    });

    if (activeHospitalization) {
      throw new BadRequestException(
        `La mascota con ID ${pet_id} ya está hospitalizada. Debe darla de alta antes de crear una nueva hospitalización.`,
      );
    }

    // Si hay fecha de alta, verificar que sea posterior a la fecha de admisión
    if (createHospitalizationDto.discharge_date) {
      const dischargeDate = new Date(createHospitalizationDto.discharge_date);
      const admissionDate = new Date(admission_date);

      if (dischargeDate < admissionDate) {
        throw new BadRequestException(
          'La fecha de alta no puede ser anterior a la fecha de admisión',
        );
      }
    }
    // Crear la hospitalización
    const hospitalization = this.hospitalizationRepository.create({
      pet_id,
      veterinarian_id,
      reason,
      description,
      user_id: loggedUser.id,
      admission_date,
      discharge_date: createHospitalizationDto.discharge_date,
      treatment: createHospitalizationDto.treatment,
      companyId: loggedUser.companyId,
    });

    return await this.hospitalizationRepository.save(hospitalization);
  }

  async findAll(companyId:number, filterDto?: HospitalizationFilterDto) {
    // Usar un objeto por defecto si filterDto es undefined
    const filters = filterDto || new HospitalizationFilterDto();

    // Crear QueryBuilder para consultas avanzadas
    const queryBuilder = this.hospitalizationRepository
      .createQueryBuilder('hosp')
      .leftJoinAndSelect('hosp.pet', 'pet')
      .leftJoinAndSelect('hosp.user', 'user')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('owner.person', 'owner_person')
      .leftJoinAndSelect('hosp.veterinarian', 'veterinarian')
      .leftJoinAndSelect('veterinarian.person', 'veterinarian_person')
      .where('hosp.companyId = :companyId', { companyId });

    // Aplicar filtros básicos
    if (filters.pet_id) {
      queryBuilder.andWhere('hosp.pet_id = :pet_id', {
        pet_id: filters.pet_id,
      });
    }

    if (filters.veterinarian_id) {
      queryBuilder.andWhere('hosp.veterinarian_id = :vet_id', {
        vet_id: filters.veterinarian_id,
      });
    }

    // Filtro por razón de hospitalización
    if (filters.reason_contains) {
      queryBuilder.andWhere('hosp.reason ILIKE :reason', {
        reason: `%${filters.reason_contains}%`,
      });
    }

    // Filtros para hospitalizaciones activas o dadas de alta
    if (filters.is_active === true) {
      queryBuilder.andWhere('hosp.discharge_date IS NULL');
    } else if (filters.is_active === false) {
      queryBuilder.andWhere('hosp.discharge_date IS NOT NULL');
    }

    // Filtros de fechas de admisión
    if (filters.admission_date_start && filters.admission_date_end) {
      queryBuilder.andWhere(
        'hosp.admission_date BETWEEN :adm_start AND :adm_end',
        {
          adm_start: filters.admission_date_start,
          adm_end: filters.admission_date_end,
        },
      );
    } else if (filters.admission_date_start) {
      queryBuilder.andWhere('hosp.admission_date >= :adm_start', {
        adm_start: filters.admission_date_start,
      });
    } else if (filters.admission_date_end) {
      queryBuilder.andWhere('hosp.admission_date <= :adm_end', {
        adm_end: filters.admission_date_end,
      });
    }

    // Filtros de fechas de alta
    if (filters.discharge_date_start && filters.discharge_date_end) {
      queryBuilder.andWhere(
        'hosp.discharge_date BETWEEN :dis_start AND :dis_end',
        {
          dis_start: filters.discharge_date_start,
          dis_end: filters.discharge_date_end,
        },
      );
    } else if (filters.discharge_date_start) {
      queryBuilder.andWhere('hosp.discharge_date >= :dis_start', {
        dis_start: filters.discharge_date_start,
      });
    } else if (filters.discharge_date_end) {
      queryBuilder.andWhere('hosp.discharge_date <= :dis_end', {
        dis_end: filters.discharge_date_end,
      });
    }

    // Filtros para mascota
    if (filters.pet_name) {
      queryBuilder.andWhere('pet.name ILIKE :pet_name', {
        pet_name: `%${filters.pet_name}%`,
      });
    }

    // Filtros para propietario
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

    // Filtros para veterinario
    if (filters.veterinarian_name) {
      queryBuilder.andWhere('veterinarian_person.full_name ILIKE :vet_name', {
        vet_name: `%${filters.veterinarian_name}%`,
      });
    }

    // Calcular skip para paginación
    const skip = (filters.page - 1) * filters.per_page;

    // Aplicar paginación y ordenamiento
    queryBuilder
      .orderBy('hosp.admission_date', 'DESC')
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

  async findOne(id: number, companyId: number): Promise<Hospitalization> {
    const hospitalization = await this.hospitalizationRepository.findOne({
      where: { id, companyId },
      relations: ['pet', 'pet.owner', 'pet.owner.person', 'veterinarian'],
    });

    if (!hospitalization) {
      throw new NotFoundException(`Hospitalización con ID ${id} no encontrada`);
    }

    return hospitalization;
  }

  async findByPet(
    companyId: number,
    petId: number,
    filterDto?: HospitalizationFilterDto,
  ): Promise<any> {
    // Verificar si la mascota existe
    const pet = await this.petRepository.findOne({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    // Crear filtros usando el mismo enfoque que en otros servicios
    const filters = filterDto || new HospitalizationFilterDto();

    // Establecer el ID de la mascota en los filtros
    filters.pet_id = petId;

    // Usar el método findAll con los filtros
    return this.findAll(companyId, filters);
  }

  async findByVeterinarian(
    companyId: number,
    veterinarianId: number,
    filterDto?: HospitalizationFilterDto,
  ): Promise<any> {
    // Verificar si el veterinario existe
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { personId: veterinarianId },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Persona con ID ${veterinarianId} no encontrada`,
      );
    }

    // Crear filtros usando el mismo enfoque que en otros servicios
    const filters = filterDto || new HospitalizationFilterDto();

    // Establecer el ID del veterinario en los filtros
    filters.veterinarian_id = veterinarianId;

    // Usar el método findAll con los filtros
    return this.findAll(companyId, filters);
  }

  async findActive(companyId: number, filterDto?: HospitalizationFilterDto): Promise<any> {
    // Crear filtros usando el mismo enfoque que en otros servicios
    const filters = filterDto || new HospitalizationFilterDto();

    // Establecer el filtro para hospitalizaciones activas
    filters.is_active = true;

    // Usar el método findAll con los filtros
    return this.findAll(companyId, filters);
  }

  async findDischarged(companyId: number, filterDto?: HospitalizationFilterDto): Promise<any> {
    // Crear filtros usando el mismo enfoque que en otros servicios
    const filters = filterDto || new HospitalizationFilterDto();

    // Establecer el filtro para hospitalizaciones dadas de alta
    filters.is_active = false;

    // Usar el método findAll con los filtros
    return this.findAll(companyId, filters);
  }

  async update(
    id: number,
    updateHospitalizationDto: UpdateHospitalizationDto,
    companyId: number
  ): Promise<Hospitalization> {
    const hospitalization = await this.findOne(id, companyId);

    // Si se intenta cambiar la mascota, verificar que exista
    if (
      updateHospitalizationDto.pet_id &&
      updateHospitalizationDto.pet_id !== hospitalization.pet_id
    ) {
      const pet = await this.petRepository.findOne({
        where: { id: updateHospitalizationDto.pet_id },
      });

      if (!pet) {
        throw new NotFoundException(
          `Mascota con ID ${updateHospitalizationDto.pet_id} no encontrada`,
        );
      }

      // Verificar si la nueva mascota ya está hospitalizada (no tiene fecha de alta)
      const activeHospitalization =
        await this.hospitalizationRepository.findOne({
          where: {
            pet_id: updateHospitalizationDto.pet_id,
            discharge_date: IsNull(),
            id: Not(id), // Excluir la hospitalización actual
            companyId: companyId,
          },
        });

      if (activeHospitalization) {
        throw new BadRequestException(
          `La mascota con ID ${updateHospitalizationDto.pet_id} ya está hospitalizada.`,
        );
      }
    }

    // Si se intenta cambiar el veterinario, verificar que exista y sea staff
    if (
      updateHospitalizationDto.veterinarian_id &&
      updateHospitalizationDto.veterinarian_id !==
        hospitalization.veterinarian_id
    ) {
      const veterinarian = await this.veterinarianRepository.findOne({
        where: { personId: updateHospitalizationDto.veterinarian_id, companyId },
      });

      if (!veterinarian) {
        throw new NotFoundException(
          `Veterinario con ID ${updateHospitalizationDto.veterinarian_id} no encontrado`,
        );
      }
    }

    // Si hay fecha de alta nueva, verificar que sea posterior a la fecha de admisión
    if (updateHospitalizationDto.discharge_date) {
      const dischargeDate = new Date(updateHospitalizationDto.discharge_date);
      const admissionDate = updateHospitalizationDto.admission_date
        ? new Date(updateHospitalizationDto.admission_date)
        : new Date(hospitalization.admission_date);

      if (dischargeDate < admissionDate) {
        throw new BadRequestException(
          'La fecha de alta no puede ser anterior a la fecha de admisión',
        );
      }
    }

    // Verificar que la fecha de admisión no sea posterior a la fecha de alta
    if (
      updateHospitalizationDto.admission_date &&
      hospitalization.discharge_date
    ) {
      const admissionDate = new Date(updateHospitalizationDto.admission_date);
      const dischargeDate = updateHospitalizationDto.discharge_date
        ? new Date(updateHospitalizationDto.discharge_date)
        : new Date(hospitalization.discharge_date);

      if (admissionDate > dischargeDate) {
        throw new BadRequestException(
          'La fecha de admisión no puede ser posterior a la fecha de alta',
        );
      }
    }

    // Actualizar los campos
    await this.hospitalizationRepository.update(id, updateHospitalizationDto);

    return this.findOne(id, companyId);
  }

  async discharge(
    id: number,
    companyId: number,
    dischargeDate: Date = new Date(),
  ): Promise<Hospitalization> {
    const hospitalization = await this.findOne(id, companyId);

    if (hospitalization.discharge_date) {
      throw new BadRequestException(
        `Esta hospitalización ya tiene fecha de alta: ${hospitalization.discharge_date.toISOString()}`,
      );
    }

    const admissionDate = new Date(hospitalization.admission_date);
    if (dischargeDate < admissionDate) {
      throw new BadRequestException(
        'La fecha de alta no puede ser anterior a la fecha de admisión',
      );
    }

    hospitalization.discharge_date = dischargeDate;

    return this.hospitalizationRepository.save(hospitalization);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const result = await this.hospitalizationRepository.softDelete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException(`Hospitalización con ID ${id} no encontrada`);
    }
  }

  async savePdf(id: number, newFilePath: string, companyId: number): Promise<Hospitalization> {
    const hospitalization = await this.hospitalizationRepository.findOne({
      where: { id, companyId },
    });

    if (!hospitalization) {
      throw new NotFoundException('Hospitalización no encontrada');
    }

    // Si ya existe un archivo anterior, lo eliminamos
    if (hospitalization.route_pdf) {
      const oldPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        hospitalization.route_pdf,
      );

      // Verificamos si el archivo existe antes de intentar borrarlo
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      } 
    }

    // Guardamos la nueva ruta
    hospitalization.route_pdf = newFilePath;

    return await this.hospitalizationRepository.save(hospitalization);
  }

  async saveFiles(
    id: number,
    newFilePaths: string[],
    companyId: number
  ): Promise<Hospitalization> {
    const record = await this.hospitalizationRepository.findOne({
      where: { id, companyId },
    });
    if (!record) {
      throw new NotFoundException('Registro de hospitalización no encontrado');
    }

    const existingFiles = record.route_pdf ? record.route_pdf.split(',') : [];

    // Concatenar los nuevos archivos
    const updatedFiles = [...existingFiles, ...newFilePaths];
    record.route_pdf = updatedFiles.join(',');

    return await this.hospitalizationRepository.save(record);
  }

  async removeFile(id: number, filePath: string, companyId: number): Promise<Hospitalization> {
  const record = await this.hospitalizationRepository.findOne({
    where: { id, companyId },
  });
  if (!record) {
    throw new NotFoundException('Registro de hospitalización no encontrado');
  }

  // Archivos guardados en BD
  const files = record.route_pdf ? record.route_pdf.split(',') : [];

  // Tomamos siempre el basename (ej: "archivo.jpg")
  const baseNameToDelete = path.basename(filePath);

  // Buscar si existe en los guardados, ya sea nombre o ruta
  const fileToDelete = files.find(
    (f) =>
      f === filePath ||               // coincide ruta completa exacta
      path.normalize(f) === path.normalize(filePath) || // normaliza slashes
      path.basename(f) === baseNameToDelete             // coincide solo nombre
  );

  if (!fileToDelete) {
    throw new NotFoundException(
      `El archivo ${filePath} no está registrado en este expediente`,
    );
  }

  // Construir la ruta absoluta real en disco
  const fullPath = path.isAbsolute(fileToDelete)
    ? fileToDelete
    : path.join(process.cwd(), fileToDelete);

  // Verificar si existe y eliminar
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  } else {
    console.warn(`⚠️ Archivo no encontrado en disco: ${fullPath}`);
  }

  // Actualizar BD quitando el archivo
  const updatedFiles = files.filter(
    (f) =>
      f !== filePath &&
      path.normalize(f) !== path.normalize(filePath) &&
      path.basename(f) !== baseNameToDelete,
  );
  record.route_pdf = updatedFiles.join(',');

  return await this.hospitalizationRepository.save(record);
}
}
