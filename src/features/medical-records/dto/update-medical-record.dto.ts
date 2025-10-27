import {
  IsOptional,
  IsNumber,
  IsDate,
  IsString,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMedicalRecordDto {
  // IDs
  @IsOptional()
  @IsNumber({}, { message: 'El ID de la mascota debe ser un número' })
  pet_id?: number; // Ej: 1, 2, 3

  @IsOptional()
  @IsNumber({}, { message: 'El ID de la cita debe ser un número' })
  appointment_id?: number; // Ej: 10

  @IsOptional()
  @IsNumber({}, { message: 'El ID del veterinario debe ser un número' })
  veterinarian_id?: number; // Ej: 3

  // Datos básicos
  @IsOptional()
  @IsString({ message: 'El diagnóstico debe ser una cadena de texto' })
  diagnosis?: string; // Ej: "Gastroenteritis infecciosa"

  @IsOptional()
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  type?: string; // Ej: "Normal", "Emergencia", "Control"

  @IsOptional()
  @IsString({ message: 'El lote debe ser una cadena de texto' })
  lote?: string; // Ej: "L230X2"

  @IsOptional()
  @IsString({ message: 'El tipo de atención debe ser una cadena de texto' })
  care_type?: string; // Ej: "Vacuna", "Antiparasitario", "Antigarrapatas"

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

  // Medicamentos y observaciones
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string; // Nombre del tratamiento. Ej: "Bravecto"

  @IsOptional()
  @IsString({ message: 'Las prescripciones deben ser una cadena de texto' })
  prescriptions?: string; // Ej: "Amoxicilina cada 12h por 7 días"

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string; // Notas clínicas generales

  // Datos clínicos
  @IsOptional()
  @IsString({ message: 'La anamnesis debe ser una cadena de texto' })
  anamnesis?: string;

  @IsOptional()
  @IsString({ message: 'El peso debe ser una cadena de texto' })
  weight?: string; // Ej: "4.5 kg"

  @IsOptional()
  @IsString({ message: 'La temperatura debe ser una cadena de texto' })
  temperature?: string; // Ej: "38.2 °C"

  @IsOptional()
  @IsString({ message: 'La frecuencia cardíaca debe ser una cadena de texto' })
  heart_rate?: string; // Ej: "90 lpm"

  @IsOptional()
  @IsString({
    message: 'La frecuencia respiratoria debe ser una cadena de texto',
  })
  breathing_frequency?: string; // Ej: "20 rpm"

  @IsOptional()
  @IsString({
    message: 'El tiempo de llenado capilar debe ser una cadena de texto',
  })
  capillary_refill_time?: string; // Ej: "2 segundos"

  @IsOptional()
  @IsString({
    message: 'El estado de las mucosas debe ser una cadena de texto',
  })
  mucous?: string; // Ej: "Rosadas"

  // Reflejos (booleanos)
  @IsOptional()
  @IsBoolean({ message: 'El reflejo deglutorio debe ser booleano' })
  swallow_reflex?: boolean; // true / false

  @IsOptional()
  @IsBoolean({ message: 'El reflejo tusígeno debe ser booleano' })
  cough_reflex?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'La palmo-percusión debe ser booleana' })
  palmo_percussion?: boolean;

  // Observaciones generales
  @IsOptional()
  @IsString({
    message: 'La palpación de linfonódulos debe ser una cadena de texto',
  })
  lymph_nodes?: string;

  @IsOptional()
  @IsString({ message: 'El estado de conciencia debe ser una cadena de texto' })
  consciousness_state?: string; // Ej: "Alerta", "Letárgico"

  @IsOptional()
  @IsString({ message: 'El estado nutricional debe ser una cadena de texto' })
  nutritional_state?: string; // Ej: "Obeso", "Desnutrido"

  @IsOptional()
  @IsString({
    message: 'El estado de hidratación debe ser una cadena de texto',
  })
  hydration_state?: string; // Ej: "Normal", "Deshidratado"

  @IsOptional()
  @IsString({ message: 'El grado de dolor debe ser una cadena de texto' })
  pain_level?: string; // Ej: "Moderado", "Severo"

  @IsOptional()
  @IsString({
    message: 'La intensidad del prurito debe ser una cadena de texto',
  })
  itch_intensity?: string; // Ej: "Ligero", "Intenso"

  @IsOptional()
  @IsString({ message: 'Los signos clínicos deben ser una cadena de texto' })
  clinical_signs?: string; // Ej: "Vómitos, diarrea, fiebre"

  @IsOptional()
  @IsString({ message: 'La presión arterial debe ser una cadena de texto' })
  blood_pressure?: string; // Ej: "120/80"

  @IsOptional()
  @IsString({
    message: 'El diagnóstico presuntivo debe ser una cadena de texto',
  })
  presumptive_diagnosis?: string;

  @IsOptional()
  @IsString({
    message: 'Los exámenes auxiliares deben ser una cadena de texto',
  })
  recommended_tests?: string; // Ej: "Hemograma, radiografía"

  @IsOptional()
  @IsString({
    message: 'El diagnóstico definitivo debe ser una cadena de texto',
  })
  definitive_diagnosis?: string;

  @IsOptional()
  @IsString({ message: 'La dieta debe ser una cadena de texto' })
  diet?: string; // Ej: "Dieta blanda por 5 días"
}
