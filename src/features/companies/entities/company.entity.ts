import { User } from 'src/features/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'companies' })
export class Company {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'char', length: 11, unique: true })
    ruc: string;

    @Column({ type: 'varchar', length: 255  })
    address: string;

    @Column({ type: 'varchar', length: 9 })
    phone_number: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date | null;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date | null;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date | null;

    @OneToMany(() => User, (user) => user.company)
    users: User[];
}
