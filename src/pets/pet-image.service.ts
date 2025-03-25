import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetImage } from './entities/pet-image.entity';
import { Pet } from './entities/pet.entity';
import * as fs from 'fs';

// Definimos una interfaz para ayudar con el tipado
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

@Injectable()
export class PetImageService {
    constructor(
        @InjectRepository(PetImage)
        private petImageRepository: Repository<PetImage>,
        @InjectRepository(Pet)
        private petRepository: Repository<Pet>,
    ) {}

    async uploadImage(
        petId: number,
        file: MulterFile,
        isMain: boolean = false,
    ): Promise<PetImage> {
        // Verificar que la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId } });
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        // Si es la imagen principal, actualizar las demás
        if (isMain) {
            await this.petImageRepository.update(
                { petId, isMain: true },
                { isMain: false },
            );
        }

        // Crear la nueva imagen
        const petImage = this.petImageRepository.create({
            petId,
            fileName: file.filename,
            filePath: file.path,
            mimeType: file.mimetype,
            size: file.size,
            isMain,
        });

        return this.petImageRepository.save(petImage);
    }

    async findAll(petId: number): Promise<PetImage[]> {
        return this.petImageRepository.find({
            where: { petId },
            order: { isMain: 'DESC', createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<PetImage> {
        const image = await this.petImageRepository.findOne({ where: { id } });
        if (!image) {
            throw new NotFoundException(`Imagen con ID ${id} no encontrada`);
        }
        return image;
    }

    async delete(id: number): Promise<void> {
        const image = await this.findOne(id);
        
        // Eliminar el archivo físico
        try {
            if (image.filePath && fs.existsSync(image.filePath)) {
                fs.unlinkSync(image.filePath);
            }
        } catch (err) {
            const error = err as Error;
            console.error(`Error al eliminar el archivo: ${error.message}`);
        }
        
        await this.petImageRepository.remove(image);
    }

    async setAsMain(id: number): Promise<PetImage> {
        const image = await this.findOne(id);
        
        // Quitar la marca de principal a todas las imágenes de esta mascota
        await this.petImageRepository.update(
            { petId: image.petId, isMain: true },
            { isMain: false },
        );
        
        // Establecer la imagen actual como principal
        image.isMain = true;
        return this.petImageRepository.save(image);
    }
}