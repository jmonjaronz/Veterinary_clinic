import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { User } from 'src/features/users/entities/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // Llamamos al método canActivate de la clase base
        return super.canActivate(context);
    }

    // Este método es llamado automáticamente por AuthGuard después de que Passport valida el token
    handleRequest<T extends User>(err: any, user: T): T {
        // Si hay error o no hay usuario, lanzamos excepción
        if (err || !user) {
        throw new UnauthorizedException('No tienes autorización para acceder a este recurso');
        }
        
        // Devolvemos el usuario si todo está bien
        return user;
    }
}