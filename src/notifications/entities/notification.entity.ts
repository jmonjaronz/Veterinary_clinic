import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'notifications' })
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @ManyToOne('User')
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'text' })
    message: string;

    @Column()
    type: string; // recordatorio, alerta, info

    @Column({ default: 'no_leída' })
    status: string; // leída, no_leída

    @Column({ type: 'timestamp', nullable: true })
    read_at: Date;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}