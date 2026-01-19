import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { PersonsService } from "../persons/persons.service";
import { CreateVeterinarianDto } from "./dto/create-veterinarian.dto";
import { UpdateVeterinarianDto } from "./dto/update-veterinarian.dto";
import { VeterinarianFilterDto } from "./dto/veterinarian-filter.dto";
import { Veterinarian } from "./entities/veterinarian.entity";
import { Person } from "../persons/entities/person.entity";

@Injectable()
export class VeterinariansService {
    constructor(
        private readonly personsService: PersonsService, 
        private readonly dataSource: DataSource,
        @InjectRepository(Veterinarian)
        private readonly veterinarianRepository: Repository<Veterinarian>,
    ) {}

    async create(
        createVeterinarianDto: CreateVeterinarianDto, 
        companyId: number
    ) {
        return await this.dataSource.transaction(async manager => {
            const { licence_number, ...personFields } = createVeterinarianDto;

            let person: Person | null = null;
            if(createVeterinarianDto.dni) {
                person = await this.personsService.findByDni(createVeterinarianDto.dni);
            }

            if(!person && createVeterinarianDto.email) {
                person =  await this.personsService.findByEmail(createVeterinarianDto.email);
            }

            if(!person) {
                person = await this.personsService.create(personFields, manager);
            }

            let veterinarian = await this.findOne(person.id, companyId)
            if(veterinarian) {
                throw new BadRequestException(`El veterinario ya existe para la persona con ID ${person.id} en la empresa`);
            }

            veterinarian = await manager.save(Veterinarian, {
                personId: person.id,
                companyId,
                licenceNumber: licence_number
            })

            const veterinarianWithRelations = await manager.findOne(Veterinarian, {
                where: { personId: veterinarian.personId, companyId },
                relations: ['person', 'company'],
            });

            return {...veterinarianWithRelations};
        })
    }

    async findAll(companyId: number, filterDto?: VeterinarianFilterDto) {
        const filters = filterDto || new VeterinarianFilterDto();

        const queryBuilder = this.veterinarianRepository
            .createQueryBuilder('veterinarian')
            .leftJoinAndSelect('veterinarian.person', 'person')
            .leftJoinAndSelect('veterinarian.company', 'company')
            .where('veterinarian.companyId = :companyId', { companyId });

        if (filters.full_name) {
            queryBuilder.andWhere('person.full_name ILIKE :full_name', {
                full_name: `%${filters.full_name}%`
            });
        }

        if (filters.email) {
            queryBuilder.andWhere('person.email ILIKE :email', {
                email: `%${filters.email}%`
            });
        }

        if (filters.dni) {
            queryBuilder.andWhere('person.dni ILIKE :dni', {
                dni: `%${filters.dni}%`
            });
        }

        if (filters.licence_number) {
            queryBuilder.andWhere('veterinarian.licenceNumber ILIKE :licence_number', {
                licence_number: `%${filters.licence_number}%`
            });
        }

        const skip = (filters.page - 1) * filters.per_page;
        queryBuilder
            .orderBy('person.full_name', 'ASC')
            .skip(skip)
            .take(filters.per_page);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                total,
                per_page: filters.per_page,
                current_page: filters.page,
                last_page: Math.ceil(total / filters.per_page),
                from: skip + 1,
                to: skip + data.length,
            },
            links: {
                first: `?page=1&per_page=${filters.per_page}`,
                last: `?page=${Math.ceil(total / filters.per_page)}&per_page=${filters.per_page}`,
                prev:
                    filters.page > 1
                        ? `?page=${filters.page - 1}&per_page=${filters.per_page}`
                        : null,
                next:
                    filters.page < Math.ceil(total / filters.per_page)
                        ? `?page=${filters.page + 1}&per_page=${filters.per_page}`
                        : null,
            }
        };
    }

    async findOne(veterinarianId: number, companyId: number): Promise<Veterinarian> {
        const veterinarian = await this.veterinarianRepository.findOne({
            where: { personId: veterinarianId, companyId },
            relations: ['person', 'company']
        });

        if (!veterinarian) {
            throw new NotFoundException(`Veterinario no encontrado`);
        }

        return veterinarian;
    }

    async update(
        veterinarianId: number,
        companyId: number,
        updateVeterinarianDto: UpdateVeterinarianDto
    ) {
        return await this.dataSource.transaction(async manager => {
            const veterinarian = await manager.findOne(Veterinarian, {
                where: { personId: veterinarianId, companyId },
                relations: ['person']
            });

            if (!veterinarian) {
                throw new NotFoundException(`Veterinario no encontrado`);
            }

            const { licence_number, ...personFields } = updateVeterinarianDto;

            // Actualizar person si hay campos
            if (Object.keys(personFields).length > 0) {
                await this.personsService.update(veterinarianId, personFields, manager);
            }

            if (licence_number !== undefined) {
                await manager.update(Veterinarian, 
                    { personId: veterinarianId, companyId },
                    { licenceNumber: licence_number }
                );
            }

            const updatedVeterinarian = await manager.findOne(Veterinarian, {
                where: { personId: veterinarianId, companyId },
                relations: ['person', 'company']
            });

            return updatedVeterinarian;
        });
    }

    async remove(veterinarianId: number, companyId: number): Promise<void> {
        const veterinarian = await this.veterinarianRepository.findOne({
            where: { personId: veterinarianId, companyId }
        });

        if (!veterinarian) {
            throw new NotFoundException(`Veterinario no encontrado`);
        }

        await this.veterinarianRepository.softDelete({
            personId: veterinarianId,
            companyId
        });
    }
}