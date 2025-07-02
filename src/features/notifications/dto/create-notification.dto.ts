import { IsNotEmpty, IsNumber, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateNotificationDto {
    @IsNotEmpty({ message: 'El ID del usuario es requerido' })
    @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
    user_id: number;

    @IsNotEmpty({ message: 'El mensaje es requerido' })
    @IsString({ message: 'El mensaje debe ser una cadena de texto' })
    message: string;

    @IsNotEmpty({ message: 'El tipo es requerido' })
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    @IsIn(['recordatorio', 'alerta', 'info'], { message: 'El tipo debe ser recordatorio, alerta o info' })
    type: string;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    @IsIn(['leída', 'no_leída'], { message: 'El estado debe ser leída o no_leída' })
    status?: string;
}