import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: configService.get('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        const { id } = payload;
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
        }

        return user;
    }
}