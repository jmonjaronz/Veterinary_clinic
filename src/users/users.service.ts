import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Person } from '../persons/entities/person.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { person_id, user_type, password } = createUserDto;
    
        // Verificar si la persona existe
        const person = await this.personRepository.findOne({ where: { id: person_id } });
        if (!person) {
            throw new NotFoundException(`Persona con ID ${person_id} no encontrada`);
        }
    
        // Verificar si ya existe un usuario con ese user_type
        const existingUser = await this.userRepository.findOne({ where: { user_type } });
        if (existingUser) {
            throw new ConflictException(`Ya existe un usuario con el tipo ${user_type}`);
        }
    
        // Hashear la contraseña de forma segura
        try {
            // Número de rondas de sal fijo para consistencia
            const rounds = 10;
            const salt = await bcrypt.genSalt(rounds);
            const hashed_password = await bcrypt.hash(password, salt);
    
            // Crear el usuario
            const user = this.userRepository.create({
                person_id,
                user_type,
                hashed_password,
            });
    
            return this.userRepository.save(user);
        } catch (error) {
            // Lanzar una excepción más específica
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            throw new Error(`Error al crear el usuario: ${errorMessage}`);
        }
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
        relations: ['person'],
        });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ 
            where: { id },
            relations: ['person'],
        });

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        return user;
    }

    async findByUsername(username: string): Promise<User> {
        const user = await this.userRepository.findOne({ 
            where: { user_type: username },
            relations: ['person'],
        });

        if (!user) {
            throw new NotFoundException(`Usuario ${username} no encontrado`);
        }

        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.user_type && updateUserDto.user_type !== user.user_type) {
        // Verificar si ya existe un usuario con ese user_type
        const existingUser = await this.userRepository.findOne({ 
            where: { user_type: updateUserDto.user_type } 
        });
        
        if (existingUser && existingUser.id !== id) {
            throw new ConflictException(`Ya existe un usuario con el tipo ${updateUserDto.user_type}`);
        }
        }

        // Actualizar campos
        if (updateUserDto.user_type) {
            user.user_type = updateUserDto.user_type;
        }

        if (updateUserDto.password) {
            try {
                const salt = await bcrypt.genSalt(10);
                user.hashed_password = await bcrypt.hash(updateUserDto.password, salt);
            } catch {
                // En caso de error, no actualizamos la contraseña
            }
        }

        return this.userRepository.save(user);
    }

    async remove(id: number): Promise<void> {
        const result = await this.userRepository.delete(id);
        
        if (result.affected === 0) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
    }
}