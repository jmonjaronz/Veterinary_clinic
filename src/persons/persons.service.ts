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
        // Valores por defecto si filterDto es undefined
        const page = filterDto?.page || 1;
        const per_page = filterDto?.per_page || 10;
        const full_name = filterDto?.full_name;
        const email = filterDto?.email;
        const dni = filterDto?.dni;
        const role = filterDto?.role;
        
        // Construir los filtros dinámicamente
        const where: FindOptionsWhere<Person> = {};
        
        if (full_name) {
            where.full_name = Like(`%${full_name}%`);
        }
        
        if (email) {
            where.email = Like(`%${email}%`);
        }
        
        if (dni) {
            where.dni = Like(`%${dni}%`);
        }
        
        if (role) {
            where.role = role;
        }
        
        // Calcular skip para paginación
        const skip = (page - 1) * per_page;
        
        // Buscar personas con filtros y paginación
        const [data, total] = await this.personRepository.findAndCount({
            where,
            skip,
            take: per_page,
            order: {
                id: 'DESC'
            }
        });
        
        // Calcular metadatos de paginación
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
        const result = await this.personRepository.delete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Persona con ID ${id} no encontrada`);
        }
    }

    async findByRole(role: string, filterDto?: PersonFilterDto) {
        // Crear una copia del filtro para evitar modificar el original
        const filter = { ...filterDto } || {};
        // Establecer el rol en los filtros
        filter.role = role;
        return this.findAll(filter);
    }

    async findClients(filterDto?: PersonFilterDto) {
        return this.findByRole('cliente', filterDto);
    }

    async findStaff(filterDto?: PersonFilterDto) {
        return this.findByRole('staff', filterDto);
    }
}