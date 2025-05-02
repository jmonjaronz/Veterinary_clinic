import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { SurgicalConsent } from './surgical-consent.entity';

@Entity({ name: 'procedure_types' })
export class ProcedureType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @OneToMany(() => SurgicalConsent, consent => consent.procedureType)
    surgicalConsents: SurgicalConsent[];
}