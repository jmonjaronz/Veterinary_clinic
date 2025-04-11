import { IsNotEmpty, IsNumber, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVaccinationRecordDto {
    @IsNotEmpty({ message: 'El ID del plan de vacunación es requerido' })
    @IsNumber({}, { message: 'El ID del plan de vacunación debe ser un número' })
    vaccination_plan_id: number;

    @IsNotEmpty({ message: 'El ID de la vacuna es requerido' })
    @IsNumber({}, { message: 'El ID de la vacuna debe ser un número' })
    vaccine_id: number;

    @IsNotEmpty({ message: 'La fecha programada es requerida' })
    @Type(() => Date)
    @IsDate({ message: 'La fecha programada debe ser una fecha válida' })
    scheduled_date: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha de administración debe ser una fecha válida' })
    administered_date?: Date;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    status?: string;
}