import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { LoginResponse } from './interfaces/login-response.interface';

// Definir la interfaz RequestWithUser para usar en lugar de any
interface RequestWithUser extends Request {
    user: {
        id: number;
        user_type: string;
        person_id: number;
    };
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req: RequestWithUser) {
        // Tipamos correctamente el valor de retorno
        return {
        id: req.user.id,
        username: req.user.user_type,
        personId: req.user.person_id
        };
    }
}