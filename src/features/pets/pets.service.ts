import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pet } from './entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Species } from '../species/entities/species.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetFilterDto } from './dto/pet-filter.dto';
import { PetResponseDto } from './dto/pet-response.dto';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class PetsService {
    constructor(
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(Species)
        private readonly speciesRepository: Repository<Species>,
        private readonly clientService: ClientsService
    ) {}

    async create(createPetDto: CreatePetDto, companyId: number): Promise<PetResponseDto> {
        // Verificar si el propietario existe
        await this.clientService.findOne(createPetDto.owner_id, companyId, undefined, `Propietario con ID ${createPetDto.owner_id} no encontrado`);
    
        // Verificar si la especie existe
        const species = await this.speciesRepository.findOne({ 
            where: { id: createPetDto.species_id } 
        });
        if (!species) {
            throw new BadRequestException(`Especie con ID ${createPetDto.species_id} no encontrada`);
        }
    
        // Validar el sexo si está presente
        if (createPetDto.sex && !['macho', 'hembra'].includes(createPetDto.sex.toLowerCase())) {
            throw new BadRequestException(`El sexo debe ser "macho" o "hembra"`);
        }

        // Crear la mascota
        const pet = this.petRepository.create(createPetDto);
        
        // Normalizar el sexo a minúsculas si existe
        if (pet.sex) {
            pet.sex = pet.sex.toLowerCase();
        }
        
        // Actualizar la edad automáticamente si hay fecha de nacimiento
        if (pet.birth_date) {
            this.calculateAge(pet);
        }
        
        const savedPet = await this.petRepository.save(pet);
        
        // Buscar el pet guardado con sus relaciones para transformarlo
        const petWithRelations = await this.findOne(savedPet.id, companyId);
        return petWithRelations;
    }

    async findAll(companyId: number, filterDto?: PetFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new PetFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.petRepository
            .createQueryBuilder('pet')
            .leftJoinAndSelect('pet.owner', 'owner')
            .leftJoinAndSelect('owner.person', 'owner_person')
            .leftJoinAndSelect('pet.species', 'species')
            .leftJoinAndSelect('pet.images', 'images')
            .leftJoin('pet.appointments', 'appointment')
            .leftJoin('pet.hospitalizations', 'hospitalization')
            .where('owner.companyId = :companyId', { companyId })

        // Aplicar filtros
        if (filters.name) {
            queryBuilder.andWhere('pet.name ILIKE :name', { name: `%${filters.name}%` });
        }

        if (filters.owner_id) {
            queryBuilder.andWhere('pet.owner_id = :owner_id', { owner_id: filters.owner_id });
        }

        if (filters.species_id) {
            queryBuilder.andWhere('pet.species_id = :species_id', { species_id: filters.species_id });
        }

        if (filters.breed) {
            queryBuilder.andWhere('pet.breed ILIKE :breed', { breed: `%${filters.breed}%` });
        }

        // Filtro por sexo
        if (filters.sex) {
            queryBuilder.andWhere('LOWER(pet.sex) = LOWER(:sex)', { sex: filters.sex });
        }

        // Filtros de rango para edad
        if (filters.age_min !== undefined && filters.age_max !== undefined) {
            queryBuilder.andWhere('pet.age BETWEEN :age_min AND :age_max', {
                age_min: filters.age_min,
                age_max: filters.age_max
            });
        } else if (filters.age_min !== undefined) {
            queryBuilder.andWhere('pet.age >= :age_min', { age_min: filters.age_min });
        } else if (filters.age_max !== undefined) {
            queryBuilder.andWhere('pet.age <= :age_max', { age_max: filters.age_max });
        }

        // Filtros de rango para fecha de nacimiento
        if (filters.birth_date_start && filters.birth_date_end) {
            queryBuilder.andWhere('pet.birth_date BETWEEN :birth_date_start AND :birth_date_end', {
                birth_date_start: filters.birth_date_start,
                birth_date_end: filters.birth_date_end
            });
        } else if (filters.birth_date_start) {
            queryBuilder.andWhere('pet.birth_date >= :birth_date_start', { birth_date_start: filters.birth_date_start });
        } else if (filters.birth_date_end) {
            queryBuilder.andWhere('pet.birth_date <= :birth_date_end', { birth_date_end: filters.birth_date_end });
        }

        // Filtros de rango para peso
        if (filters.weight_min !== undefined && filters.weight_max !== undefined) {
            queryBuilder.andWhere('pet.weight BETWEEN :weight_min AND :weight_max', {
                weight_min: filters.weight_min,
                weight_max: filters.weight_max
            });
        } else if (filters.weight_min !== undefined) {
            queryBuilder.andWhere('pet.weight >= :weight_min', { weight_min: filters.weight_min });
        } else if (filters.weight_max !== undefined) {
            queryBuilder.andWhere('pet.weight <= :weight_max', { weight_max: filters.weight_max });
        }

        // Filtros para propietario y especie (relaciones)
        if (filters.owner_name) {
            queryBuilder.andWhere('owner_person.full_name ILIKE :owner_name', { owner_name: `%${filters.owner_name}%` });
        }

        if (filters.species_name) {
            queryBuilder.andWhere('species.name ILIKE :species_name', { species_name: `%${filters.species_name}%` });
        }

        // Filtro para documento de consentimiento
        if (filters.has_consent_document === 'yes') {
            queryBuilder.andWhere('pet.consent_document IS NOT NULL');
        } else if (filters.has_consent_document === 'no') {
            queryBuilder.andWhere('pet.consent_document IS NULL');
        }

        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('pet.id', 'DESC')
            .skip(skip)
            .take(filters.per_page);
        
        // Ejecutar la consulta
        const [data, total] = await queryBuilder.getManyAndCount();
        
        // Transformar los datos para incluir las URLs de las imágenes
        const transformedData = data.map(pet => this.transformPetResponse(pet));
        
        // Calcular metadatos de paginación
        const lastPage = Math.ceil(total / filters.per_page);
        
        return {
            data: transformedData,
            meta: {
                total,
                per_page: filters.per_page,
                current_page: filters.page,
                last_page: lastPage,
                from: skip + 1,
                to: skip + data.length,
            },
            links: {
                first: `?page=1&per_page=${filters.per_page}`,
                last: `?page=${lastPage}&per_page=${filters.per_page}`,
                prev: filters.page > 1 ? `?page=${filters.page - 1}&per_page=${filters.per_page}` : null,
                next: filters.page < lastPage ? `?page=${filters.page + 1}&per_page=${filters.per_page}` : null,
            }
        };
    }

    async findOne(id: number, companyId: number): Promise<PetResponseDto> {
        const pet = await this.petRepository.findOne({
            where: { id, owner: { companyId } },
            relations: ['owner', 'owner.person', 'species', 'images'],
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }
        
        return this.transformPetResponse(pet);
    }      

    async findByOwner(ownerId: number, companyId: number, filterDto?: PetFilterDto): Promise<any> {
        // Crea una copia del filtro
        const filters = filterDto ? { ...filterDto } : new PetFilterDto();
        
        // Establece el owner_id
        filters.owner_id = ownerId;
        
        // Usa el método findAll con los filtros
        return this.findAll(companyId, filters);
    }
    
    async findBySpecies(speciesId: number, companyId: number, filterDto?: PetFilterDto): Promise<any> {
        // Crea una copia del filtro
        const filters = filterDto ? { ...filterDto } : new PetFilterDto();
        
        // Establece el species_id
        filters.species_id = speciesId;
        
        // Usa el método findAll con los filtros
        return this.findAll(companyId, filters);
    }

    async update(id: number, updatePetDto: UpdatePetDto, companyId: number): Promise<PetResponseDto> {
        const pet = await this.petRepository.findOne({
            where: { id, owner: { companyId } },
            relations: ['owner', 'species', 'images'],
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }

        // Verificar si el propietario existe si se intenta cambiar
        if (updatePetDto.owner_id && updatePetDto.owner_id !== pet.owner_id) {
            await this.clientService.findOne(updatePetDto.owner_id, companyId, undefined, `Propietario con ID ${updatePetDto.owner_id} no encontrado`);
        }

        // Verificar si la especie existe si se intenta cambiar
        if (updatePetDto.species_id && updatePetDto.species_id !== pet.species_id) {
            const species = await this.speciesRepository.findOne({ 
                where: { id: updatePetDto.species_id } 
            });
            if (!species) {
                throw new BadRequestException(`Especie con ID ${updatePetDto.species_id} no encontrada`);
            }
        }

        // Validar el sexo si está presente
        if (updatePetDto.sex && !['macho', 'hembra'].includes(updatePetDto.sex.toLowerCase())) {
            throw new BadRequestException(`El sexo debe ser "macho" o "hembra"`);
        }

        // Normalizar el sexo a minúsculas si existe
        if (updatePetDto.sex) {
            updatePetDto.sex = updatePetDto.sex.toLowerCase();
        }

        // Si se actualiza la fecha de nacimiento, actualizar automáticamente la edad
        if (updatePetDto.birth_date && (!pet.birth_date || 
            new Date(updatePetDto.birth_date).getTime() !== new Date(pet.birth_date).getTime())) {
            // Actualizar la fecha de nacimiento
            pet.birth_date = updatePetDto.birth_date;
            
            // Calcular la nueva edad
            this.calculateAge(pet);
            
            // Eliminar la edad del DTO para evitar sobrescribir el cálculo automático
            delete updatePetDto.age;
        }

        // Actualizar campos
        Object.assign(pet, updatePetDto);
        
        await this.petRepository.save(pet);
        
        // Volver a buscar el pet con sus relaciones para transformarlo
        return this.findOne(id, companyId);
    }

    async remove(id: number, companyId: number): Promise<void> {

        const pet = await this.petRepository.findOne({
            where: { id, owner: { companyId } },
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }
    
        await this.petRepository.softDelete(id);
    }

    // Método para subir documento de consentimiento
    async uploadConsentDocument(petId: number, file: Express.Multer.File, companyId: number): Promise<PetResponseDto> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({
            where: { id: petId, owner: { companyId } },
            relations: ['owner', 'owner.person', 'species', 'images'],
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        // Si ya existe un documento previo, eliminarlo
        if (pet.consent_document) {
            const oldFilePath = path.join(
                __dirname, 
                '..', 
                '..', 
                'uploads/consents', 
                pet.consent_document.replace('uploads/consents/', '')
            );
            
            try {
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (error) {
                console.error(`Error al eliminar el documento previo: ${error}`);
            }
        }

        // Guardar la referencia al nuevo documento
        pet.consent_document = `uploads/consents/${file.filename}`;
        
        await this.petRepository.save(pet);
        
        // Retornar la mascota actualizada
        return this.transformPetResponse(pet);
    }
    
    // Método privado para transformar la respuesta
    private transformPetResponse(pet: Pet): PetResponseDto {
        // Transformar cada imagen para incluir la ruta relativa
        const transformedImages = pet.images?.map(image => ({
            ...image,
            url: `/uploads/pets/${image.fileName}` // Usar la ruta relativa basada en el prefijo configurado
        })) || [];
        
        // Encontrar la imagen principal
        const mainImage = transformedImages.find(img => img.isMain === true);
        
        // Crear una copia de pet para evitar modificar la entidad original
        const responseDto: PetResponseDto = {
            ...pet,
            photo: pet.photo, // Mantener el valor original (puede ser null)
            images: transformedImages,
            mainImageUrl: mainImage ? mainImage.url : null,
            photoUrl: pet.photo ? `/uploads/${pet.photo.replace('uploads/', '')}` : null,
            consentDocumentUrl: pet.consent_document ? `/uploads/consents/${pet.consent_document.replace('uploads/consents/', '')}` : null
        };
        
        return responseDto;
    }

    // Método para calcular la edad de la mascota basada en su fecha de nacimiento
    private calculateAge(pet: Pet): void {
        if (!pet.birth_date) return;
        
        const today = new Date();
        const birthDate = new Date(pet.birth_date);
        
        // Calcular la diferencia en meses
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
        months -= birthDate.getMonth();
        months += today.getMonth();
        
        // Ajustar por días si es necesario
        if (today.getDate() < birthDate.getDate()) {
            months--;
        }
        
        pet.age = months > 0 ? months : 0;
    }
}