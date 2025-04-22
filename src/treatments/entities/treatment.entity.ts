import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';

@Entity({ name: 'treatments' })
export class Treatment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    medical_record_id: number;

    @ManyToOne(() => MedicalRecord, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'medical_record_id' })
    medical_record: MedicalRecord;

    @Column({ type: 'timestamp' })
    date: Date;

    @Column({ type: 'text' })
    reason: string;

    @Column({ type: 'text' })
    diagnosis: string;

    @Column({ type: 'text' })
    treatment: string;

    @Column({ type: 'text', nullable: true })
    examinations: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}