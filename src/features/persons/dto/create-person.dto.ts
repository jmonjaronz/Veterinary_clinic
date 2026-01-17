import { IsNotEmpty, IsString, IsEmail, IsOptional, ValidateIf, IsNumber } from 'class-validator';

export class CreatePersonDto {
    @IsNotEmpty({ message: 'El nombre completo es requerido' })
    @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
    full_name: string;

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

    @ValidateIf((person: CreatePersonDto) => person.role === 'staff')
    @IsNotEmpty({message: 'El ID de la empresa es requerido para el rol staff. Añade la propiedad company_id'})
    @IsNumber({}, {message: 'El ID de la empresa debe ser un número'})
    company_id?: number;
}