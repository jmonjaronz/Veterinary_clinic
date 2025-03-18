import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { SpeciesVaccinationPlan } from '../../species-vaccination-plans/entities/species-vaccination-plan.entity';

@Entity({ name: 'vaccination_plans' })
export class VaccinationPlan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    pet_id: number;

    @ManyToOne('Pet', 'vaccination_plans')
    @JoinColumn({ name: 'pet_id' })
    pet: Pet;

    @Column()
    species_vaccination_plan_id: number;

    @ManyToOne('SpeciesVaccinationPlan')
    @JoinColumn({ name: 'species_vaccination_plan_id' })
    species_vaccination_plan: SpeciesVaccinationPlan;

    @Column({ type: 'date' })
    scheduled_date: Date;

    @Column({ type: 'date', nullable: true })
    administered_date: Date;

    @Column({ default: 'pendiente' })
    status: string; // pendiente, completado, cancelado

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}