import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Person } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';

@Injectable()
export class PersonsService {
    constructor(
        @InjectRepository(Person)
        private personRepository: Repository<Person>,
    ) {}

    async create(createPersonDto: CreatePersonDto): Promise<Person> {
        const person = this.personRepository.create(createPersonDto);
        return this.personRepository.save(person);
    }

    async findAll(filterDto?: PersonFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new PersonFilterDto();
        
        // Construir los filtros dinámicamente
        const where: FindOptionsWhere<Person> = {};
        
        if (filters.full_name) {
            where.full_name = Like(`%${filters.full_name}%`);
        }
        
        if (filters.email) {
            where.email = Like(`%${filters.email}%`);
        }
        
        if (filters.dni) {
            where.dni = Like(`%${filters.dni}%`);
        }
        
        if (filters.role) {
            where.role = filters.role;
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Buscar personas con filtros y paginación
        const [data, total] = await this.personRepository.findAndCount({
            where,
            skip,
            take: filters.per_page,
            order: {
                id: 'DESC'
            }
        });
        
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

    async findOne(id: number): Promise<Person> {
        const person = await this.personRepository.findOne({ where: { id } });

        if (!person) {
            throw new NotFoundException(`Persona con ID ${id} no encontrada`);
        }

        return person;
    }

    async update(id: number, updatePersonDto: UpdatePersonDto): Promise<Person> {
        const person = await this.findOne(id);
        
        // Actualizar los campos
        Object.assign(person, updatePersonDto);
        
        return this.personRepository.save(person);
    }

    async remove(id: number): Promise<void> {
        const result = await this.personRepository.softDelete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Persona con ID ${id} no encontrada`);
        }
    }

    async findByRole(role: string, filterDto?: PersonFilterDto) {
        // Crear una nueva instancia de PersonFilterDto
        const filters = filterDto ? new PersonFilterDto() : new PersonFilterDto();
        
        // Copiar las propiedades de filterDto si existe
        if (filterDto) {
            Object.assign(filters, filterDto);
        }
        
        // Establecer el rol
        filters.role = role;
        
        return this.findAll(filters);
    }

    async findClients(filterDto?: PersonFilterDto) {
        return this.findByRole('cliente', filterDto);
    }

    async findStaff(filterDto?: PersonFilterDto) {
        return this.findByRole('staff', filterDto);
    }
}