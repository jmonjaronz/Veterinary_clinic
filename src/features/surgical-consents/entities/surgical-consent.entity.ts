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
import { Appointment } from '../../appointments/entities/appointment.entity';
import { ProcedureType } from './procedure-type.entity';
import { Veterinarian } from 'src/features/veterinarians/entities/veterinarian.entity';

@Entity({ name: 'surgical_consents' })
export class SurgicalConsent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  appointment_id: number;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column()
  pet_id: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column()
  owner_id: number;

  @ManyToOne(() => Person)
  @JoinColumn({ name: 'owner_id' })
  owner: Person;

  @Column()
  veterinarian_id: number;
  
  @Column({name: 'company_id'})
  companyId: number;

  @ManyToOne(() => Veterinarian)
  @JoinColumn([
    { name: 'veterinarian_id', referencedColumnName: 'personId' },
    { name: 'company_id', referencedColumnName: 'companyId' }
  ])
  veterinarian: Veterinarian;

  @Column({ nullable: true })
  procedure_type_id: number;

  @ManyToOne(() => ProcedureType)
  @JoinColumn({ name: 'procedure_type_id' })
  procedureType: ProcedureType;

  @Column({ nullable: true })
  custom_procedure_type: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ nullable: true })
  signed_document: string;

  @Column({ default: 'pendiente' })
  status: string; // pendiente, firmado, cancelado

  @Column({ type: 'timestamp' })
  scheduled_date: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
