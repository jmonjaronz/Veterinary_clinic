import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Person } from '../../persons/entities/person.entity';
import { Appointment } from 'src/features/appointments/entities/appointment.entity';
import { Hospitalization } from 'src/features/hospitalizations/entities/hospitalization.entity';
import { MedicalRecord } from 'src/features/medical-records/entities/medical-record.entity';
import { OpinionMedicalRecord } from 'src/features/opinion-medical-record/entities/opinion-medical-record.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  person_id: number;

  @ManyToOne(() => Person, { eager: true })
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ unique: false })
  user_type: string;

  @Column({ select: false })
  @Exclude({ toPlainOnly: true }) // Excluye este campo al serializar
  hashed_password: string;

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];

  @OneToMany(() => Hospitalization, (hospitalization) => hospitalization.user)
  hospitalizations: Hospitalization[];

  @OneToMany(() => MedicalRecord, (medicalRecord) => medicalRecord.user)
  medicalRecords: MedicalRecord[];

  @OneToMany(
    () => OpinionMedicalRecord,
    (opinionMedicalRecord) => opinionMedicalRecord.medical_record,
  )
  opinions: OpinionMedicalRecord[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
