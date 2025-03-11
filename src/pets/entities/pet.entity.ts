import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Person } from '../../persons/entities/person.entity';
import { Species } from '../../species/entities/species.entity';

@Entity({ name: 'pets' })
export class Pet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    species_id: number;

    // Usamos strings para el tipo y la propiedad de relación inversa
    @ManyToOne('Species', 'pets', { eager: true })
    @JoinColumn({ name: 'species_id' })
    species: Species;

    @Column({ nullable: true })
    breed: string;

    @Column({ nullable: true })
    age: number;

    @Column({ type: 'float', nullable: true })
    weight: number;

    @Column({ type: 'float', nullable: true })
    temperature: number;

    @Column()
    owner_id: number;

    @ManyToOne('Person', 'pets')
    @JoinColumn({ name: 'owner_id' })
    owner: Person;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    photo: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}