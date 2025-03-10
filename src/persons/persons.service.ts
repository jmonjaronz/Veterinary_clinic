import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

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

    async findAll(): Promise<Person[]> {
        return this.personRepository.find();
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

    async findByRole(role: string): Promise<Person[]> {
        return this.personRepository.find({ where: { role } });
    }

    async findClients(): Promise<Person[]> {
        return this.findByRole('cliente');
    }

    async findStaff(): Promise<Person[]> {
        return this.findByRole('staff');
    }
}