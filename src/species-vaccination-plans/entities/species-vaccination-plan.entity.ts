import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
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

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @OneToMany(() => Vaccine, vaccine => vaccine.species_vaccination_plan)
    vaccines: Vaccine[];
}