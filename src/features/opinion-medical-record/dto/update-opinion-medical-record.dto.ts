import {
  IsString,
  IsOptional,
} from 'class-validator';

export class UpdateOpinionDto {
  @IsOptional()
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  comment?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  observations?: string;
}
