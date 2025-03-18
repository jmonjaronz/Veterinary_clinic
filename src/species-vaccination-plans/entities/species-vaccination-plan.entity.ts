import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Species } from '../../species/entities/species.entity';

@Entity({ name: 'species_vaccination_plans' })
export class SpeciesVaccinationPlan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    species_id: number;

    @ManyToOne('Species', 'species_vaccination_plans')
    @JoinColumn({ name: 'species_id' })
    species: Species;

    @Column()
    vaccine: string;

    @Column()
    recommended_age: number;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}