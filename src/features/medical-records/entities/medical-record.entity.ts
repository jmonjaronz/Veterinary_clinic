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
import { Person } from '../../persons/entities/person.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

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

  @ManyToOne('Appointment', { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column()
  veterinarian_id: number;

  @ManyToOne('Person')
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Person;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text', nullable: true })
  prescriptions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'date' })
  appointment_date: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  // Relación con tratamientos - usando string para evitar importación circular
  @OneToMany('Treatment', 'medical_record')
  treatments: any[];
}
