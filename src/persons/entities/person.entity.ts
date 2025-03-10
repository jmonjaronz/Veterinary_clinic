import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Pet } from '../../pets/entities/pet.entity';

@Entity({ name: 'persons' })
export class Person {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    full_name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    dni: string;

    @Column({ nullable: true })
    phone_number: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ default: 'cliente' })
    role: string; // 'staff', 'cliente', etc.

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @OneToMany(() => User, user => user.person)
    users: User[];

    @OneToMany(() => Pet, pet => pet.owner)
    pets: Pet[];
}