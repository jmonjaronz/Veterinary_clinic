import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProcedureTypeDto {
    @IsNotEmpty({ message: 'El nombre del procedimiento es requerido' })
    @IsString({ message: 'El nombre del procedimiento debe ser una cadena de texto' })
    name: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;

    @IsOptional()
    @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
    is_active?: boolean;
}