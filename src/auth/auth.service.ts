import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) {}

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.userRepository.findOne({ 
        where: { user_type: username },
        relations: ['person']
        });

        if (user && await bcrypt.compare(password, user.hashed_password)) {
        const { hashed_password, ...result } = user;
        return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;
        const user = await this.validateUser(username, password);
        
        if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
        }

        const payload = { 
        username: user.user_type,
        sub: user.id,
        id: user.id,
        role: user.person.role
        };

        return {
        access_token: this.jwtService.sign(payload),
        user: {
            id: user.id,
            username: user.user_type,
            personId: user.person_id,
            fullName: user.person.full_name,
            role: user.person.role
        }
        };
    }
}