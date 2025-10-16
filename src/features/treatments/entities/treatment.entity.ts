import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';

@Entity({ name: 'treatments' })
export class Treatment {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ nullable: true })
  medical_record_id?: number;

  @ManyToOne(() => MedicalRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_record_id' })
  medical_record?: MedicalRecord;

  @Column({ type: 'timestamp', nullable: true })
  date?: Date;

  @Column({ type: 'boolean', default: false, nullable: true })
  medication?: boolean; // "¿Medicación?"

  @Column({ type: 'text', nullable: true })
  description?: string; // "Descripción"

  @Column({ type: 'text', nullable: true })
  dose?: string; // "Dosis"

  @Column({ type: 'text', nullable: true })
  frequency?: string; // "Frecuencia"

  @Column({ type: 'text', nullable: true })
  duration?: string; // "Duración"

  @Column({ type: 'text', nullable: true })
  observations?: string; // "Observaciones"

  @Column({ type: 'text', nullable: true })
  blood_pressure: string; // Presión arterial

  @Column({ type: 'text', nullable: true })
  temperature: string; // Temperatura corporal (°C)

  @Column({ type: 'json', nullable: true })
  medications?: {
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
  }[];

  @CreateDateColumn({ name: 'created_at', nullable: true })
  created_at?: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
