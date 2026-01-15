import { Company } from "src/features/companies/entities/company.entity";
import { Person } from "src/features/persons/entities/person.entity";
import { CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'veterinarians'})
export class Veterinarian {
    @PrimaryColumn({name: 'person_id'})
    personId: number;

    @PrimaryColumn({name: 'company_id'})
    companyId: number;

    @ManyToOne(() => Person)
    @JoinColumn({name: 'person_id'})
    person: Person;

    @ManyToOne(() => Company)
    @JoinColumn({name: 'company_id'})
    company: Company;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date | null;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date | null;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date | null;
}