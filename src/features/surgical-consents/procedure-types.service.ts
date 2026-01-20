import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcedureType } from './entities/procedure-type.entity';
import { CreateProcedureTypeDto } from './dto/create-procedure-type.dto';
import { UpdateProcedureTypeDto } from './dto/update-procedure-type.dto';
import { ProcedureTypeFilterDto } from './dto/procedure-type-filter.dto';

@Injectable()
export class ProcedureTypesService {
    constructor(
        @InjectRepository(ProcedureType)
        private readonly procedureTypeRepository: Repository<ProcedureType>,
    ) {}

    async create(createProcedureTypeDto: CreateProcedureTypeDto): Promise<ProcedureType> {
        // Verificar si ya existe un procedimiento con el mismo nombre
        const existingProcedure = await this.procedureTypeRepository.findOne({
            where: { name: createProcedureTypeDto.name }
        });

        if (existingProcedure) {
            throw new ConflictException(`Ya existe un tipo de procedimiento con el nombre ${createProcedureTypeDto.name}`);
        }

        const procedureType = this.procedureTypeRepository.create(createProcedureTypeDto);
        return this.procedureTypeRepository.save(procedureType);
    }

    async findAll(filterDto?: ProcedureTypeFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new ProcedureTypeFilterDto();
        
        // Construir la consulta
        const queryBuilder = this.procedureTypeRepository.createQueryBuilder('procedureType');
        
        // Aplicar filtros
        if (filters.name) {
            queryBuilder.andWhere('procedureType.name ILIKE :name', { name: `%${filters.name}%` });
        }
        
        if (filters.is_active !== undefined) {
            queryBuilder.andWhere('procedureType.is_active = :isActive', { isActive: filters.is_active });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('procedureType.name', 'ASC')
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

    async findActive() {
        return this.procedureTypeRepository.find({
            where: { is_active: true },
            order: { name: 'ASC' }
        });
    }

    async findOne(id: number): Promise<ProcedureType> {
        const procedureType = await this.procedureTypeRepository.findOne({
            where: { id }
        });

        if (!procedureType) {
            throw new NotFoundException(`Tipo de procedimiento con ID ${id} no encontrado`);
        }

        return procedureType;
    }

    async update(id: number, updateProcedureTypeDto: UpdateProcedureTypeDto): Promise<ProcedureType> {
        const procedureType = await this.findOne(id);
        
        // Si se intenta cambiar el nombre, verificar que no exista otro con ese nombre
        if (updateProcedureTypeDto.name && updateProcedureTypeDto.name !== procedureType.name) {
            const existingProcedure = await this.procedureTypeRepository.findOne({
                where: { name: updateProcedureTypeDto.name }
            });

            if (existingProcedure && existingProcedure.id !== id) {
                throw new ConflictException(`Ya existe un tipo de procedimiento con el nombre ${updateProcedureTypeDto.name}`);
            }
        }

        // Actualizar campos
        await this.procedureTypeRepository.update(id, updateProcedureTypeDto);
        
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const result = await this.procedureTypeRepository.softDelete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Tipo de procedimiento con ID ${id} no encontrado`);
        }
    }

    async activate(id: number): Promise<ProcedureType> {
        const procedureType = await this.findOne(id);
        
        if (procedureType.is_active) {
            return procedureType; // Ya está activo
        }
        
        procedureType.is_active = true;
        return this.procedureTypeRepository.save(procedureType);
    }

    async deactivate(id: number): Promise<ProcedureType> {
        const procedureType = await this.findOne(id);
        
        if (!procedureType.is_active) {
            return procedureType; // Ya está inactivo
        }
        
        procedureType.is_active = false;
        return this.procedureTypeRepository.save(procedureType);
    }
}