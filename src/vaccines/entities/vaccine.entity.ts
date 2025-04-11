import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SpeciesVaccinationPlan } from '../../species-vaccination-plans/entities/species-vaccination-plan.entity';

@Entity({ name: 'vaccines' })
export class Vaccine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    species_vaccination_plan_id: number;

    @ManyToOne(() => SpeciesVaccinationPlan, plan => plan.vaccines, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'species_vaccination_plan_id' })
    species_vaccination_plan: SpeciesVaccinationPlan;

    @Column()
    name: string;

    @Column()
    application_age: number;  // Edad de aplicación en meses

    @Column()
    validity: number;  // Vigencia en meses

    @Column({ default: false })
    is_mandatory: boolean;  // Indica si la vacuna es obligatoria

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}