import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSpeciesDto {
    @IsNotEmpty({ message: 'El nombre de la especie es requerido' })
    @IsString({ message: 'El nombre de la especie debe ser una cadena de texto' })
    name: string;

    @IsOptional()
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    type?: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;
}