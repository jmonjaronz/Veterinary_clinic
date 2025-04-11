import { IsOptional, IsNumber, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVaccinationRecordDto {
    @IsOptional()
    @IsNumber({}, { message: 'El ID del plan de vacunación debe ser un número' })
    vaccination_plan_id?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El ID de la vacuna debe ser un número' })
    vaccine_id?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha programada debe ser una fecha válida' })
    scheduled_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'La fecha de administración debe ser una fecha válida' })
    administered_date?: Date;

    @IsOptional()
    @IsString({ message: 'El estado debe ser una cadena de texto' })
    status?: string;
}