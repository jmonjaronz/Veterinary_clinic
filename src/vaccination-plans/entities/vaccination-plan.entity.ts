import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { SpeciesVaccinationPlan } from '../../species-vaccination-plans/entities/species-vaccination-plan.entity';
import { VaccinationRecord } from './vaccination-record.entity';

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

    @Column({ default: 'activo' })
    status: string;  // activo, inactivo, completado

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @OneToMany(() => VaccinationRecord, record => record.vaccination_plan)
    vaccination_records: VaccinationRecord[];
}