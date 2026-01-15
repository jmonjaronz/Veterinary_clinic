import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { User } from 'src/features/users/entities/user.entity';
import { OpinionMedicalRecord } from 'src/features/opinion-medical-record/entities/opinion-medical-record.entity';
import { Veterinarian } from 'src/features/veterinarians/entities/veterinarian.entity';

@Entity({ name: 'medical_records' })
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pet_id: number;

  @ManyToOne('Pet', 'medical_records')
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ nullable: true })
  appointment_id: number;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column()
  veterinarian_id: number;

  @ManyToOne(() => Veterinarian)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian;

  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Veterinarian)
  @JoinColumn({ name: 'company_id' })
  company: Veterinarian;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text', nullable: true })
  route_files: string; // Guardará las rutas separadas por comas

  // @Column({ type: 'text', nullable: true })
  // name: string;

  @Column({ type: 'text', nullable: true })
  lote: string;

  @Column({ type: 'text', nullable: true })
  care_type: string;

  @Column({ type: 'date', nullable: true })
  date_next_application: string | null;

  @Column({ type: 'text', nullable: true })
  note_next_application: string;

  @Column({ type: 'date', nullable: false })
  appointment_date: string;

  // CAMPOS DE ANÁLISIS CLÍNICO
  @Column({ type: 'text', nullable: true })
  anamnesis: string; // Historia clínica proporcionada por el dueño

  @Column({ type: 'text', nullable: true })
  weight: string; // Peso en kilogramos

  @Column({ type: 'text', nullable: true })
  temperature: string; // Temperatura corporal (°C)

  @Column({ type: 'text', nullable: true })
  heart_rate: string; // Frecuencia cardíaca (latidos por minuto)

  @Column({ type: 'text', nullable: true })
  breathing_frequency: string; // Frecuencia respiratoria (respiraciones por minuto)

  @Column({ type: 'text', nullable: true })
  capillary_refill_time: string; // Tiempo de llenado capilar

  @Column({ type: 'text', nullable: true })
  mucous: string; // Estado de las mucosas

  // CAMPOS NUEVOS BOOLEANOS
  @Column({ type: 'boolean', default: false })
  swallow_reflex: boolean; // Reflejo deglutorio (¿presente?)

  @Column({ type: 'boolean', default: false })
  cough_reflex: boolean; // Reflejo tusígeno (¿presente?)

  @Column({ type: 'boolean', default: false })
  palmo_percussion: boolean; // Palmo-percusión (¿presente?)

  // CAMPOS NUEVOS DE OBSERVACIÓN
  @Column({ type: 'text', nullable: true })
  lymph_nodes: string; // Palpación de linfonódulos (aumento de volumen)

  @Column({ type: 'text', nullable: true })
  consciousness_state: string; // Estado de conciencia

  @Column({ type: 'text', nullable: true })
  nutritional_state: string; // Estado nutricional

  @Column({ type: 'text', nullable: true })
  hydration_state: string; // Estado de hidratación

  @Column({ type: 'text', nullable: true })
  pain_level: string; // Grado del dolor

  @Column({ type: 'text', nullable: true })
  itch_intensity: string; // Intensidad del prurito

  @Column({ type: 'text', nullable: true })
  clinical_signs: string; // Signos clínicos

  @Column({ type: 'text', nullable: true })
  blood_pressure: string; // Presión arterial

  @Column({ type: 'text', nullable: true })
  presumptive_diagnosis: string; // Diagnóstico presuntivo

  @Column({ type: 'text', nullable: true })
  recommended_tests: string; // Exámenes auxiliares recomendados

  @Column({ type: 'text', nullable: true })
  definitive_diagnosis: string; // Diagnóstico definitivo

  @Column({ type: 'text', nullable: true })
  diet: string; // Dieta recomendada

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @OneToMany('Treatment', 'medical_record')
  treatments: any[];

  @Column({ nullable: true })
  user_id: number;

  @OneToMany(
    () => OpinionMedicalRecord,
    (opinionMedicalRecord) => opinionMedicalRecord.medical_record,
  )
  opinions: OpinionMedicalRecord[];

  @ManyToOne(() => User, (user) => user.medicalRecords)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
