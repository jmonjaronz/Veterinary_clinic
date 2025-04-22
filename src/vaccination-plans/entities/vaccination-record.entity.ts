import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VaccinationPlan } from './vaccination-plan.entity';
import { Vaccine } from '../../vaccines/entities/vaccine.entity';

@Entity({ name: 'vaccination_records' })
export class VaccinationRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    vaccination_plan_id: number;

    @ManyToOne(() => VaccinationPlan, plan => plan.vaccination_records, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vaccination_plan_id' })
    vaccination_plan: VaccinationPlan;

    @Column()
    vaccine_id: number;

    @ManyToOne(() => Vaccine)
    @JoinColumn({ name: 'vaccine_id' })
    vaccine: Vaccine;

    // Nuevo campo para referenciar la vacuna original del plan
    @Column({ nullable: true })
    plan_vaccine_id: number;

    @ManyToOne(() => Vaccine)
    @JoinColumn({ name: 'plan_vaccine_id' })
    plan_vaccine: Vaccine;

    // Nuevo campo para habilitar/deshabilitar la vacuna
    @Column({ default: true })
    enabled: boolean;

    @Column({ type: 'date' })
    scheduled_date: Date;

    @Column({ type: 'date', nullable: true })
    administered_date: Date;

    @Column({ default: 'pendiente' })
    status: string;  // pendiente, completado, cancelado

    // Nuevo campo para notas adicionales
    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}