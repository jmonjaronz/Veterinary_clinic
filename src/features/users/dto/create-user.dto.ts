import { IsNotEmpty, IsString, IsNumber, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El ID de la persona es requerido' })
  @IsNumber({}, { message: 'El ID de la persona debe ser un número' })
  person_id: number;


  @IsNotEmpty({ message: 'El tipo de usuario es requerido' })
  @IsString({ message: 'El tipo de usuario debe ser una cadena de texto' })
  user_type: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
