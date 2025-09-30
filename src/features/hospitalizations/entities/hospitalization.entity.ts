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
import { User } from 'src/features/users/entities/user.entity';

@Entity({ name: 'hospitalizations' })
export class Hospitalization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pet_id: number;

  @ManyToOne('Pet', 'hospitalizations')
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column()
  veterinarian_id: number;

  @ManyToOne('Person')
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Person;

  @Column()
  reason: string;

  // Cambio de nombre del campo
  @Column({ type: 'text' })
  description: string; // Antes era consent_document

  @Column({ type: 'date' })
  admission_date: Date;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  route_pdf: string;

  @Column({ type: 'date', nullable: true })
  discharge_date: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @Column({ nullable: true })
  user_id: number;
  
  @ManyToOne(() => User, (user) => user.hospitalizations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
