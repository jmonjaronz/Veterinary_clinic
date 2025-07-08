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
  id: number;

  @Column()
  medical_record_id: number;

  @ManyToOne(() => MedicalRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_record_id' })
  medical_record: MedicalRecord;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'boolean', default: false })
  medication: boolean; // "¿Medicación?"

  @Column({ type: 'text' })
  description: string; // "Descripción"

  @Column({ type: 'text', nullable: true })
  dose: string; // "Dosis"

  @Column({ type: 'text', nullable: true })
  frequency: string; // "Frecuencia"

  @Column({ type: 'text', nullable: true })
  duration: string; // "Duración"

  @Column({ type: 'text', nullable: true })
  observations: string; // "Observaciones"

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
