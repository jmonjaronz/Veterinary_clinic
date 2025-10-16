import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicalRecordDto {
  @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
  @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
  pet_id: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de la cita debe ser un número' })
  appointment_id?: number;

  @IsNotEmpty({ message: 'El ID del veterinario es requerido' })
  @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
  veterinarian_id: number;

  @IsNotEmpty({ message: 'El diagnóstico es requerido' })
  @IsString({ message: 'El diagnóstico debe ser una cadena de texto' })
  diagnosis: string;

  @IsNotEmpty({ message: 'El tipo es requerido' })
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  type: string;

  @IsOptional()
  @IsString({ message: 'El lote debe ser una cadena de texto' })
  lote?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de atención debe ser una cadena de texto' })
  care_type?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha siguiente de la cita debe tener formato válido YYYY-MM-DD',
    },
  )
  date_next_application?: string;

  @IsOptional()
  @IsString({ message: 'La nota de siguiente aplicación debe ser una cadena' })
  note_next_application?: string;

  @IsNotEmpty({ message: 'La fecha de la cita es requerida' })
  @IsDateString(
    {},
    { message: 'La fecha de la cita debe tener formato válido YYYY-MM-DD' },
  )
  appointment_date: string; // <-- string (no String, ni Date)

  // CAMPOS CLÍNICOS
  @IsOptional()
  @IsString({ message: 'La anamnesis debe ser una cadena de texto' })
  anamnesis?: string;

  @IsOptional()
  @IsString({ message: 'El peso debe ser una cadena de texto' })
  weight?: string;

  @IsOptional()
  @IsString({ message: 'La temperatura debe ser una cadena de texto' })
  temperature?: string;

  @IsOptional()
  @IsString({ message: 'La frecuencia cardíaca debe ser una cadena de texto' })
  heart_rate?: string;

  @IsOptional()
  @IsString({
    message: 'La frecuencia respiratoria debe ser una cadena de texto',
  })
  breathing_frequency?: string;

  @IsOptional()
  @IsString({
    message: 'El tiempo de llenado capilar debe ser una cadena de texto',
  })
  capillary_refill_time?: string;

  @IsOptional()
  @IsString({
    message: 'El estado de las mucosas debe ser una cadena de texto',
  })
  mucous?: string;

  // BOOLEANOS
  @IsOptional()
  @IsBoolean({ message: 'El reflejo deglutorio debe ser booleano' })
  swallow_reflex?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'El reflejo tusígeno debe ser booleano' })
  cough_reflex?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'La palmo-percusión debe ser booleana' })
  palmo_percussion?: boolean;

  // OBSERVACIONES
  @IsOptional()
  @IsString({
    message: 'La palpación de linfonódulos debe ser una cadena de texto',
  })
  lymph_nodes?: string;

  @IsOptional()
  @IsString({ message: 'El estado de conciencia debe ser una cadena de texto' })
  consciousness_state?: string;

  @IsOptional()
  @IsString({ message: 'El estado nutricional debe ser una cadena de texto' })
  nutritional_state?: string;

  @IsOptional()
  @IsString({
    message: 'El estado de hidratación debe ser una cadena de texto',
  })
  hydration_state?: string;

  @IsOptional()
  @IsString({ message: 'El grado de dolor debe ser una cadena de texto' })
  pain_level?: string;

  @IsOptional()
  @IsString({
    message: 'La intensidad del prurito debe ser una cadena de texto',
  })
  itch_intensity?: string;

  @IsOptional()
  @IsString({ message: 'Los signos clínicos deben ser una cadena de texto' })
  clinical_signs?: string;

  @IsOptional()
  @IsString({ message: 'La presión arterial debe ser una cadena de texto' })
  blood_pressure?: string;

  @IsOptional()
  @IsString({
    message: 'El diagnóstico presuntivo debe ser una cadena de texto',
  })
  presumptive_diagnosis?: string;

  @IsOptional()
  @IsString({
    message: 'Los exámenes auxiliares deben ser una cadena de texto',
  })
  recommended_tests?: string;

  @IsOptional()
  @IsString({
    message: 'El diagnóstico definitivo debe ser una cadena de texto',
  })
  definitive_diagnosis?: string;

  @IsOptional()
  @IsString({ message: 'La dieta debe ser una cadena de texto' })
  diet?: string;
}
