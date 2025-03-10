import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Person } from '../../persons/entities/person.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    person_id: number;

    @ManyToOne(() => Person, { eager: true })
    @JoinColumn({ name: 'person_id' })
    person: Person;

    @Column({ unique: true })
    user_type: string;

    @Column()
    @Exclude({ toPlainOnly: true }) // Excluye este campo al serializar
    hashed_password: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}