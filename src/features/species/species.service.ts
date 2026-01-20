import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Species } from './entities/species.entity';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { SpeciesFilterDto } from './dto/species-filter.dto';

@Injectable()
export class SpeciesService {
    constructor(
        @InjectRepository(Species)
        private readonly speciesRepository: Repository<Species>,
    ) {}

    async create(createSpeciesDto: CreateSpeciesDto): Promise<Species> {
        // Verificar si ya existe una especie con ese nombre
        const existingSpecies = await this.speciesRepository.findOne({
            where: { name: createSpeciesDto.name }
        });

        if (existingSpecies) {
            throw new ConflictException(`Ya existe una especie con el nombre ${createSpeciesDto.name}`);
        }

        const species = this.speciesRepository.create(createSpeciesDto);
        return this.speciesRepository.save(species);
    }

    async findAll(filterDto?: SpeciesFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new SpeciesFilterDto();
        
        // Extraer los valores de filtrado
        const { page, per_page, name, type } = filters;
        
        // Construir los filtros dinámicamente
        const where: FindOptionsWhere<Species> = {};
        
        if (name) {
            where.name = Like(`%${name}%`);
        }
        
        if (type) {
            where.type = Like(`%${type}%`);
        }
        
        // Calcular skip para paginación
        const skip = (page - 1) * per_page;
        
        // Buscar especies con filtros y paginación
        const [data, total] = await this.speciesRepository.findAndCount({
            where,
            skip,
            take: per_page,
            order: {
                id: 'DESC'
            },
            relations: ['pets']
        });
        
        // Calcular metadatos de paginación
        const lastPage = Math.ceil(total / per_page);
        
        return {
            data,
            meta: {
                total,
                per_page,
                current_page: page,
                last_page: lastPage,
                from: skip + 1,
                to: skip + data.length,
            },
            links: {
                first: `?page=1&per_page=${per_page}`,
                last: `?page=${lastPage}&per_page=${per_page}`,
                prev: page > 1 ? `?page=${page - 1}&per_page=${per_page}` : null,
                next: page < lastPage ? `?page=${page + 1}&per_page=${per_page}` : null,
            }
        };
    }

    async findOne(id: number): Promise<Species> {
        const species = await this.speciesRepository.findOne({ 
            where: { id },
            relations: ['pets']
        });

        if (!species) {
            throw new NotFoundException(`Especie con ID ${id} no encontrada`);
        }

        return species;
    }

    async update(id: number, updateSpeciesDto: UpdateSpeciesDto): Promise<Species> {
        const species = await this.findOne(id);

        // Verificar si ya existe otra especie con ese nombre
        if (updateSpeciesDto.name && updateSpeciesDto.name !== species.name) {
            const existingSpecies = await this.speciesRepository.findOne({
                where: { name: updateSpeciesDto.name }
            });

            if (existingSpecies && existingSpecies.id !== id) {
                throw new ConflictException(`Ya existe una especie con el nombre ${updateSpeciesDto.name}`);
            }
        }

        // Actualizar los campos
        await this.speciesRepository.update(id, updateSpeciesDto);
        
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const result = await this.speciesRepository.softDelete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Especie con ID ${id} no encontrada`);
        }
    }
}