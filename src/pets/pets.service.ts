import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Pet } from './entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Species } from '../species/entities/species.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetFilterDto } from './dto/pet-filter.dto';
import { PetResponseDto } from './dto/pet-response.dto';

@Injectable()
export class PetsService {
    constructor(
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
        @InjectRepository(Species)
        private readonly speciesRepository: Repository<Species>,
        private readonly configService: ConfigService,
    ) {}

    async create(createPetDto: CreatePetDto): Promise<Pet> {
        // Verificar si el propietario existe
        const owner = await this.personRepository.findOne({ 
            where: { id: createPetDto.owner_id } 
        });
        if (!owner) {
            throw new BadRequestException(`Propietario con ID ${createPetDto.owner_id} no encontrado`);
        }

        // Verificar si la especie existe
        const species = await this.speciesRepository.findOne({ 
            where: { id: createPetDto.species_id } 
        });
        if (!species) {
            throw new BadRequestException(`Especie con ID ${createPetDto.species_id} no encontrada`);
        }

        // Crear la mascota
        const pet = this.petRepository.create(createPetDto);
        const savedPet = await this.petRepository.save(pet);
        
        // Buscar el pet guardado con sus relaciones para transformarlo
        const petWithRelations = await this.findOne(savedPet.id);
        return petWithRelations;
    }

    async findAll(filterDto?: PetFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new PetFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.petRepository
            .createQueryBuilder('pet')
            .leftJoinAndSelect('pet.owner', 'owner')
            .leftJoinAndSelect('pet.species', 'species')
            .leftJoinAndSelect('pet.images', 'images');

        // Aplicar filtros
        if (filters.name) {
            queryBuilder.andWhere('pet.name LIKE :name', { name: `%${filters.name}%` });
        }

        if (filters.owner_id) {
            queryBuilder.andWhere('pet.owner_id = :owner_id', { owner_id: filters.owner_id });
        }

        if (filters.species_id) {
            queryBuilder.andWhere('pet.species_id = :species_id', { species_id: filters.species_id });
        }

        if (filters.breed) {
            queryBuilder.andWhere('pet.breed LIKE :breed', { breed: `%${filters.breed}%` });
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
            queryBuilder.andWhere('owner.full_name LIKE :owner_name', { owner_name: `%${filters.owner_name}%` });
        }

        if (filters.species_name) {
            queryBuilder.andWhere('species.id LIKE :species_name', { species_name: `%${filters.species_name}%` });
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

    async findOne(id: number): Promise<PetResponseDto> {
        const pet = await this.petRepository.findOne({
            where: { id },
            relations: ['owner', 'species', 'images'],
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }
        
        return this.transformPetResponse(pet);
    }      

    async findByOwner(ownerId: number, filterDto?: PetFilterDto): Promise<any> {
        // Crea una copia del filtro
        const filters = filterDto ? { ...filterDto } : new PetFilterDto();
        
        // Establece el owner_id
        filters.owner_id = ownerId;
        
        // Usa el método findAll con los filtros
        return this.findAll(filters);
    }
    
    async findBySpecies(speciesId: number, filterDto?: PetFilterDto): Promise<any> {
        // Crea una copia del filtro
        const filters = filterDto ? { ...filterDto } : new PetFilterDto();
        
        // Establece el species_id
        filters.species_id = speciesId;
        
        // Usa el método findAll con los filtros
        return this.findAll(filters);
    }

    async update(id: number, updatePetDto: UpdatePetDto): Promise<PetResponseDto> {
        const pet = await this.petRepository.findOne({
            where: { id },
            relations: ['owner', 'species', 'images'],
        });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }

        // Verificar si el propietario existe si se intenta cambiar
        if (updatePetDto.owner_id && updatePetDto.owner_id !== pet.owner_id) {
            const owner = await this.personRepository.findOne({ 
                where: { id: updatePetDto.owner_id } 
            });
            if (!owner) {
                throw new BadRequestException(`Propietario con ID ${updatePetDto.owner_id} no encontrado`);
            }
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

        // Actualizar campos
        Object.assign(pet, updatePetDto);
        
        await this.petRepository.save(pet);
        
        // Volver a buscar el pet con sus relaciones para transformarlo
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const result = await this.petRepository.delete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
        }
    }
    
    // Método privado para transformar la respuesta
    private transformPetResponse(pet: Pet): PetResponseDto {
        const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
        
        // Transformar cada imagen para incluir la URL completa
        const transformedImages = pet.images?.map(image => ({
            ...image,
            url: `${baseUrl}/${image.filePath}`
        })) || [];
        
        // Encontrar la imagen principal
        const mainImage = transformedImages.find(img => img.isMain === true);
        
        // Crear una copia de pet para evitar modificar la entidad original
        const responseDto: PetResponseDto = {
            ...pet,
            photo: pet.photo, // Mantener el valor original (puede ser null)
            images: transformedImages,
            mainImageUrl: mainImage ? mainImage.url : null,
            photoUrl: pet.photo ? `${baseUrl}/${pet.photo}` : null
        };
        
        return responseDto;
    }
}