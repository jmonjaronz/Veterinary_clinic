import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateNotificationDto {
    @IsOptional()
    @IsString({ message: 'El mensaje debe ser una cadena de texto' })
    message?: string;

    @IsOptional()
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    @IsIn(['recordatorio', 'alerta', 'info'], { message: 'El tipo debe ser recordatorio, alerta o info' })
    type?: string;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    @IsIn(['leída', 'no_leída'], { message: 'El estado debe ser leída o no_leída' })
    status?: string;
}