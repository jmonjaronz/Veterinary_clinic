import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Define la interfaz para el payload del JWT
interface JwtPayload {
    id: number;
    sub: number;
    username: string;
    role: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        if (!payload || !payload.id) {
        throw new UnauthorizedException('Token no válido');
        }

        try {
        const user = await this.userRepository.findOne({ 
            where: { id: payload.id } 
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        return user;
        } catch {
        throw new UnauthorizedException('Error al validar el token');
        }
    }
}