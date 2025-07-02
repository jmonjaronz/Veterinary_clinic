import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from 'src/features/users/entities/user.entity';
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
  created_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  // Usamos strings en lugar de funciones arrow
  @OneToMany('User', 'person')
  users: User[];

  @OneToMany('Pet', 'owner')
  pets: Pet[];
}
