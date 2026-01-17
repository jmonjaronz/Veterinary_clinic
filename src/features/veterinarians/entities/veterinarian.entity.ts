import { Appointment } from "src/features/appointments/entities/appointment.entity";
import { Company } from "src/features/companies/entities/company.entity";
import { Hospitalization } from "src/features/hospitalizations/entities/hospitalization.entity";
import { MedicalRecord } from "src/features/medical-records/entities/medical-record.entity";
import { Person } from "src/features/persons/entities/person.entity";
import { SurgicalConsent } from "src/features/surgical-consents/entities/surgical-consent.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";

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

    @Column({name: 'licence_number', type: 'varchar', length: 100, nullable: true})
    licenceNumber: string | null;

    @OneToMany(() => Appointment, (appointment) => appointment.veterinarian)
    appointments: Appointment[];

    @OneToMany(() => MedicalRecord, (medicalRecord) => medicalRecord.veterinarian)
    medicalRecords: MedicalRecord[];

    @OneToMany(() => SurgicalConsent, (surgicalConsent) => surgicalConsent.veterinarian)
    surgicalConsents: SurgicalConsent[];

    @OneToMany(() => Hospitalization, (hospitalization) => hospitalization.veterinarian)
    hospitalizations: Hospitalization[]

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date | null;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date | null;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date | null;
}