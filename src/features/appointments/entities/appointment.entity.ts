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
import { Pet } from '../../pets/entities/pet.entity';
import { Person } from '../../persons/entities/person.entity';

@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  correlative: string; // control, emergencia, vacunación

  @Column()
  pet_id: number;

  @ManyToOne('Pet', 'appointments')
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column()
  veterinarian_id: number;

  @ManyToOne('Person')
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Person;

  @Column()
  appointment_type: string; // control, emergencia, vacunación

  @Column({ nullable: true, default:"Normal" })
  type: string ;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ default: 'programada' })
  status: string; // programada, completada, cancelada

  @Column({ type: 'text', nullable: true })
  document: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
