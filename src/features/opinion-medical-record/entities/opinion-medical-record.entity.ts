import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';
import { User } from 'src/features/users/entities/user.entity';
import { Pet } from 'src/features/pets/entities/pet.entity';
import { Client } from 'src/features/clients/entities/client.entity';

@Entity({ name: 'opinions' })
export class OpinionMedicalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  medical_record_id: number;

  @ManyToOne(() => MedicalRecord, (record) => record.opinions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_record_id' })
  medical_record: MedicalRecord;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.opinions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  pet_id: number;

  @ManyToOne(() => Pet, (pet) => pet.opinions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column()
  owner_id: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: Client;

  @Column({ type: 'text' })
  comment: string; // Comentario del tutor

  @Column({ type: 'text', nullable: true })
  observations?: string; // Observaciones adicionales

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;
}
