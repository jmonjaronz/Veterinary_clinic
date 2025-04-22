import { IsOptional, IsNumber, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTreatmentDto {
    @IsOptional()
    @IsNumber({}, { message: 'El ID del registro médico debe ser un número' })
    medical_record_id?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha debe ser una fecha válida' })
    date?: Date;

    @IsOptional()
    @IsString({ message: 'El motivo debe ser una cadena de texto' })
    reason?: string;

    @IsOptional()
    @IsString({ message: 'El diagnóstico debe ser una cadena de texto' })
    diagnosis?: string;

    @IsOptional()
    @IsString({ message: 'El tratamiento debe ser una cadena de texto' })
    treatment?: string;

    @IsOptional()
    @IsString({ message: 'Los exámenes deben ser una cadena de texto' })
    examinations?: string;
}