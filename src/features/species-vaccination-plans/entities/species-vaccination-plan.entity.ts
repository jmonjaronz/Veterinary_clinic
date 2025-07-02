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
import { Species } from '../../species/entities/species.entity';
import { Vaccine } from '../../vaccines/entities/vaccine.entity';

@Entity({ name: 'species_vaccination_plans' })
export class SpeciesVaccinationPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  species_id: number;

  @ManyToOne('Species', 'species_vaccination_plans')
  @JoinColumn({ name: 'species_id' })
  species: Species;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => Vaccine, (vaccine) => vaccine.species_vaccination_plan)
  vaccines: Vaccine[];
}
