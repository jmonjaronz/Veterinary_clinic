import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './interfaces/login-response.interface';

// Define la interfaz para el payload del JWT
interface JwtPayload {
    username: string;
    sub: number;
    id: number;
    role: string;
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

            let isValid = false;
            try {
                if (user.hashed_password) {
                    isValid = await bcrypt.compare(password, user.hashed_password);
                }
            } catch {
                // Capturamos cualquier error sin usar la variable
                return null;
            }
            
            if (isValid) {
                // Extraemos propiedades sin usar el nombre de la variable descartada
                const { hashed_password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
            
            return null;
            } catch {
            // Captura sin usar la variable de error
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

        // Accedemos a las propiedades de manera segura
        const personRole = user.person.role || 'cliente';
        const personName = user.person.full_name || '';

        const payload: JwtPayload = { 
            username: user.user_type,
            sub: user.id,
            id: user.id,
            role: personRole
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.user_type,
                personId: user.person_id,
                fullName: personName,
                role: personRole
            }
        };
    }
}