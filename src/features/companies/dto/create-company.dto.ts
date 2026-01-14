import {
    IsEmail,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';

export class CreateCompanyDto {
    @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
    @IsString({ message: 'El nombre debe de ser una cadena de texto' })
    name: string;

    @IsNotEmpty({ message: 'El RUC de la empresa es requerido' })
    @IsNumberString({}, { message: 'El RUC solo debe de contener números' })
    @Length(11, 11, { message: 'El RUC debe tener 11 dígitos' })
    ruc: string;

    @IsNotEmpty({ message: 'La dirección es requerida'})
    @IsString({ message: 'La dirección debe de ser una cadena de texto' })
    address: string;

    @IsNotEmpty({ message: 'El número de teléfono es requerido' })
    @IsNumberString(
        {},
        { message: 'El número de teléfono solo debe de contener números' },
    )
    @Length(9, 9, {message: 'El número de teléfono debe tener 9 dígitos'})
    phone_number: string;

    @IsOptional()
    @IsEmail(
        {},
        { message: 'El correo electrónico debe de tener un formato válido' },
    )
    email?: string;
}
