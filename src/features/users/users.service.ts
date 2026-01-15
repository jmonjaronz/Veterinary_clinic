import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Person } from '../persons/entities/person.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { person_id, company_id, user_type, password } = createUserDto;

        // Verificar si la persona existe
        const person = await this.personRepository.findOne({
            where: { id: person_id },
        });
        if (!person) {
            throw new NotFoundException(
                `Persona con ID ${person_id} no encontrada`,
            );
        }

        //Verrificar si la empresa existe
        const company = await this.companyRepository.findOne({
            where: { id: company_id },
        });
        if (!company) {
            throw new NotFoundException(
                `Empresa con ID ${company_id} no encontrada`,
            );
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
                companyId: company_id
            });
    
            return this.userRepository.save(user);
        } catch (error) {
            // Lanzar una excepción más específica
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            throw new Error(`Error al crear el usuario: ${errorMessage}`);
        }
    }

    async findAll(filterDto?: UserFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new UserFilterDto();
        
        // Extraer los valores de filtrado
        const {
            page,
            per_page,
            user_type,
            person_id,
            full_name,
            email
        } = filters;
        
        // Construir la consulta con relaciones
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.person', 'person')
            .leftJoinAndSelect('user.company', 'company');

        // Aplicar filtros
        if (user_type) {
            queryBuilder.andWhere('user.user_type LIKE :user_type', { user_type: `%${user_type}%` });
        }
        
        if (person_id) {
            queryBuilder.andWhere('user.person_id = :person_id', { person_id });
        }
        
        if (full_name) {
            queryBuilder.andWhere('person.full_name LIKE :full_name', { full_name: `%${full_name}%` });
        }
        
        if (email) {
            queryBuilder.andWhere('person.email LIKE :email', { email: `%${email}%` });
        }
        
        // Calcular skip para paginación
        const skip = (page - 1) * per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('user.id', 'DESC')
            .skip(skip)
            .take(per_page);
        
        // Ejecutar la consulta
        const [data, total] = await queryBuilder.getManyAndCount();
        
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

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['person', 'company'],
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
        const result = await this.userRepository.softDelete(id);
        
        if (result.affected === 0) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
    }
}