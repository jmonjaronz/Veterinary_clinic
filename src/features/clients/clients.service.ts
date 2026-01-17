import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PersonsService } from "../persons/persons.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { Person } from "../persons/entities/person.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Client } from "./entities/client.entity";
import { DataSource, FindOptionsWhere, ILike, Repository } from "typeorm";
import { UpdateClientDto } from "./dto/update-client.dto";
import { ClientFilterDto } from "./dto/client-filter.dto";

@Injectable()
export class ClientsService {
    constructor(
        private readonly personsService: PersonsService, 
        @InjectRepository(Client) private readonly clientRepository: Repository<Client>,
        private readonly dataSource: DataSource,
    ) {}

    async create(createClientDto: CreateClientDto, companyId: number) {
        return await this.dataSource.transaction(async (manager) => {
            let person: Person | null = null;
            
            // Buscar persona existente por DNI o email
            if (createClientDto.dni) {
                person = await this.personsService.findByDni(createClientDto.dni);
            } 
            if (!person && createClientDto.email) {
                person = await this.personsService.findByEmail(createClientDto.email);
            }
            
            // Si no existe, crear nueva persona dentro de la transacción
            if (!person) {
                person = await this.personsService.create(createClientDto, manager);
            }
            
            // Verificar si ya es cliente de esta compañía
            const existingClient = await manager.findOne(Client, {
                where: { personId: person.id, companyId }
            });
            
            if (existingClient) {
                throw new BadRequestException('Esta persona ya es cliente de la compañía');
            }
            
            // Crear el cliente
            const client = manager.create(Client, {
                personId: person.id,
                companyId: companyId
            });
            
            await manager.save(client);
            
            // Retornar con la relación person cargada
            return {
                ...client,
                person
            };
        });
    }   

    async update(clientId: number, updateClientDto: UpdateClientDto, companyId: number) {
        const client = await this.findOne(clientId, companyId, ['person']);
        const { personId } = client;
        await this.personsService.update(personId, updateClientDto);

        return {
            ...client
        }
    }

    async delete(clientId: number, companyId: number) {
        const client = await this.findOne(clientId, companyId, ['pets']);
        if (client.pets && client.pets.length > 0) {
            throw new BadRequestException(
                `No se puede eliminar el cliente: tiene mascotas asociadas`,
            );
        }

        await this.clientRepository.softDelete({personId: client.personId, companyId});
    }

    async findOne(clientId: number, companyId: number, relations?: string[], errorMessage?: string )  {
        const client = await this.clientRepository.findOne({
            where: { id: clientId, companyId },
            relations: relations
        });

        if (!client) {
            throw new NotFoundException(errorMessage || 'Cliente no encontrado');
        }

        return client;
    }

    async findAll(companyId: number, filterDto: ClientFilterDto) {
        const filters = filterDto || new ClientFilterDto();

        const where: FindOptionsWhere<Person> = {};

        if(filters.full_name) {
            where.full_name = ILike(`%${filters.full_name}%`);
        }
        if(filters.dni) {
            where.dni = ILike(`%${filters.dni}%`);
        }
        if(filters.email) {
            where.email = ILike(`%${filters.email}%`);
        }

        const skip = (filters.page - 1) * filters.per_page;
        const [ data, total ] = await this.clientRepository.findAndCount({
            where: {
                companyId,
                person: where
            },
            relations: ['person'],
            skip,
            take: filters.per_page,
            order: {
                person: {
                    full_name: 'ASC'
                }
            }
        });
        const lastPage = Math.ceil(total / filters.per_page);

        return {
            data,
            meta: {
                total,
                per_page: filters.per_page,
                current_page: filters.page,
                last_page: lastPage,
                from: skip + 1,
                to: skip + data.length
            },
            links: {
                first: `?page=1&per_page=${filters.per_page}`,
                last: `?page=${lastPage}&per_page=${filters.per_page}`,
                prev:
                    filters.page > 1
                        ? `?page=${filters.page - 1}&per_page=${filters.per_page}`
                        : null,
                next:
                    filters.page < lastPage
                        ? `?page=${filters.page + 1}&per_page=${filters.per_page}`
                        : null,
            }
        }
    }

    async hasPet(clientId: number, petId: number, companyId: number): Promise<boolean> {
        const client = await this.clientRepository.findOne({
            where: { id: clientId, companyId, pets: { id: petId } },
            relations: ['pets']
        })
        return !!client;
    }

}