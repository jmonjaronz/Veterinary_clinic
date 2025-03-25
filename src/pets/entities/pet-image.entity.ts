import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pet } from './pet.entity';

@Entity('pet_images')
export class PetImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'pet_id' })
    petId: number;

    @Column({ name: 'file_name' })
    fileName: string;

    @Column({ name: 'file_path' })
    filePath: string;

    @Column({ name: 'is_main', default: false })
    isMain: boolean;

    @Column({ name: 'mime_type', nullable: true })
    mimeType: string;

    @Column({ nullable: true })
    size: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Pet, pet => pet.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pet_id' })
    pet: Pet;
}