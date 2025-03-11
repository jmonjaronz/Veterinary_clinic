import { IsOptional, IsString } from 'class-validator';
import { CreateSpeciesDto } from './create-species.dto';

export class UpdateSpeciesDto implements Partial<CreateSpeciesDto> {
    @IsOptional()
    @IsString({ message: 'El nombre de la especie debe ser una cadena de texto' })
    name?: string;

    @IsOptional()
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    type?: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;
}