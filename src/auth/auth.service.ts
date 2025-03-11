import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

interface JwtPayload {
    username: string;
    sub: number;
    id: number;
    role: string;
    }

interface UserResponse {
    id: number;
    username: string;
    personId: number;
    fullName: string;
    role: string;
}

interface LoginResponse {
    access_token: string;
    user: UserResponse;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(username: string, password: string): Promise<Omit<User, 'hashed_password'> | null> {
        try {
        const user = await this.userRepository.findOne({ 
            where: { user_type: username },
            relations: ['person']
        });

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
        
        if (isPasswordValid) {
            // Creamos un nuevo objeto omitiendo hashed_password
            const { hashed_password, ...result } = user;
            return result;
        }
        
        return null;
        } catch (error) {
        return null;
        }
    }

    async login(loginDto: LoginDto): Promise<LoginResponse> {
        const { username, password } = loginDto;
        const user = await this.validateUser(username, password);
        
        if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.person) {
        throw new UnauthorizedException('Usuario sin perfil asociado');
        }

        const payload: JwtPayload = { 
        username: user.user_type,
        sub: user.id,
        id: user.id,
        role: user.person.role || 'cliente'
        };

        return {
        access_token: this.jwtService.sign(payload),
        user: {
            id: user.id,
            username: user.user_type,
            personId: user.person_id,
            fullName: user.person.full_name,
            role: user.person.role || 'cliente'
        }
        };
    }
}