import { OmitType } from "@nestjs/mapped-types";
import { IsOptional, IsString } from "class-validator";
import { CreatePersonDto } from "src/features/persons/dto/create-person.dto";

export class CreateVeterinarianDto extends OmitType(CreatePersonDto, ['role', 'company_id']) {
    @IsOptional()
    @IsString({ message: 'El número de licencia debe ser una cadena de texto' })
    licence_number?: string;
}