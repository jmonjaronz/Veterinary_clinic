import { Company } from "src/features/companies/entities/company.entity";
import { Person } from "src/features/persons/entities/person.entity";
import { Pet } from "src/features/pets/entities/pet.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'clients' })
export class Client {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ name: 'person_id' })
    personId: number;

    @Column({ name: 'company_id' })
    companyId: number;

    @ManyToOne(() => Person)
    @JoinColumn({ name: 'person_id' })
    person: Person;

    @ManyToOne(() => Company)   
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @OneToMany(() => Pet, pet => pet.owner)
    pets: Pet[]

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date | null;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date | null;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date | null;
}