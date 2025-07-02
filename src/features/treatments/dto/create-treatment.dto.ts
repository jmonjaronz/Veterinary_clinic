import { IsNotEmpty, IsNumber, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTreatmentDto {
    @IsNotEmpty({ message: 'El ID del registro médico es requerido' })
    @IsNumber({}, { message: 'El ID del registro médico debe ser un número' })
    medical_record_id: number;

    @IsNotEmpty({ message: 'La fecha es requerida' })
    @Type(() => Date)
    @IsDate({ message: 'La fecha debe ser una fecha válida' })
    date: Date;

    @IsNotEmpty({ message: 'El motivo es requerido' })
    @IsString({ message: 'El motivo debe ser una cadena de texto' })
    reason: string;

    @IsNotEmpty({ message: 'El diagnóstico es requerido' })
    @IsString({ message: 'El diagnóstico debe ser una cadena de texto' })
    diagnosis: string;

    @IsNotEmpty({ message: 'El tratamiento es requerido' })
    @IsString({ message: 'El tratamiento debe ser una cadena de texto' })
    treatment: string;

    @IsOptional()
    @IsString({ message: 'Los exámenes deben ser una cadena de texto' })
    examinations?: string;
}