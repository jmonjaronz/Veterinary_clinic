import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Person } from '../../persons/entities/person.entity';
import { Species } from '../../species/entities/species.entity';
import { PetImage } from './pet-image.entity';
import { OpinionMedicalRecord } from 'src/features/opinion-medical-record/entities/opinion-medical-record.entity';
import { Appointment } from 'src/features/appointments/entities/appointment.entity';
import { Hospitalization } from 'src/features/hospitalizations/entities/hospitalization.entity';
import { Client } from 'src/features/clients/entities/client.entity';

@Entity({ name: 'pets' })
export class Pet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  species_id: number;

  @ManyToOne('Species', 'pets', { eager: true })
  @JoinColumn({ name: 'species_id' })
  species: Species;

  @Column({ nullable: true })
  breed: string;

  @Column({ nullable: true })
  age: number;

  // Nuevo campo de sexo
  @Column({ nullable: true })
  sex: string; // 'macho' o 'hembra'

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ type: 'float', nullable: true })
  weight: number;

  @Column({ type: 'float', nullable: true })
  temperature: number;

  @Column()
  owner_id: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'owner_id' })
  owner: Client;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ nullable: true })
  consent_document: string;

  @OneToMany(
    () => OpinionMedicalRecord,
    (opinionMedicalRecord) => opinionMedicalRecord.pet,
  )
  opinions: OpinionMedicalRecord[];

  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments: Appointment[];

  @OneToMany(() => Hospitalization, (hospitalization) => hospitalization.pet)
  hospitalizations: Hospitalization[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  // Relación con imágenes
  @OneToMany(() => PetImage, (petImage) => petImage.pet)
  images: PetImage[];

  // Método hook que se ejecuta antes de insertar o actualizar
  @BeforeInsert()
  @BeforeUpdate()
  updateAgeFromBirthDate() {
    // Actualizar la edad automáticamente basada en la fecha de nacimiento si existe
    if (this.birth_date) {
      const today = new Date();
      const birthDate = new Date(this.birth_date);

      // Calcular la diferencia en meses
      let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
      months -= birthDate.getMonth();
      months += today.getMonth();

      // Ajustar por días si es necesario
      if (today.getDate() < birthDate.getDate()) {
        months--;
      }

      this.age = months > 0 ? months : 0;
    }
  }
}
