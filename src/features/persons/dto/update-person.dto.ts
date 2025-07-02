import { IsOptional, IsString, IsEmail } from 'class-validator';
import { CreatePersonDto } from './create-person.dto';

export class UpdatePersonDto implements Partial<CreatePersonDto> {
    @IsOptional()
    @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
    full_name?: string;

    @IsOptional()
    @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
    email?: string;

    @IsOptional()
    @IsString({ message: 'El DNI debe ser una cadena de texto' })
    dni?: string;

    @IsOptional()
    @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
    phone_number?: string;

    @IsOptional()
    @IsString({ message: 'La dirección debe ser una cadena de texto' })
    address?: string;

    @IsOptional()
    @IsString({ message: 'El rol debe ser una cadena de texto' })
    role?: string;
}