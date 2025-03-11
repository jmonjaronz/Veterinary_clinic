import { IsOptional, IsString, IsNumber, Min, IsPositive } from 'class-validator';
import { CreatePetDto } from './create-pet.dto';

export class UpdatePetDto implements Partial<CreatePetDto> {
    @IsOptional()
    @IsString({ message: 'El nombre de la mascota debe ser una cadena de texto' })
    name?: string;

    @IsOptional()
    @IsNumber({}, { message: 'El ID de la especie debe ser un número' })
    species_id?: number;

    @IsOptional()
    @IsString({ message: 'La raza debe ser una cadena de texto' })
    breed?: string;

    @IsOptional()
    @IsNumber({}, { message: 'La edad debe ser un número' })
    @Min(0, { message: 'La edad no puede ser negativa' })
    age?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El peso debe ser un número' })
    @IsPositive({ message: 'El peso debe ser un valor positivo' })
    weight?: number;

    @IsOptional()
    @IsNumber({}, { message: 'La temperatura debe ser un número' })
    temperature?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID del propietario debe ser un número' })
    owner_id?: number;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'La URL de la foto debe ser una cadena de texto' })
    photo?: string;
}