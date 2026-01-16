import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, EntityManager } from 'typeorm';
import { Person } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PersonsService {
constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,

    // 👇 ESTA ES LA PARTE CLAVE
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}
/** 🔹 Crear persona y, si es STAFF, crearle usuario automáticamente (solo si no existe ni está eliminado) */
async create(createPersonDto: CreatePersonDto, manager?: EntityManager): Promise<Person> {
  // Crear y guardar la persona
  const personRepo = manager ? manager.getRepository(Person) : this.personRepository;

  const person = personRepo.create(createPersonDto);
  const savedPerson = await personRepo.save(person);

  // Solo si el rol es STAFF
  if (savedPerson.role === 'staff') {
    try {
      // Validar datos mínimos
      if (!savedPerson.dni || !savedPerson.full_name) {
        console.warn(
          `⚠️ No se puede crear usuario staff: falta nombre o DNI para ${savedPerson.full_name || '(sin nombre)'}.`,
        );
        return savedPerson;
      }

      // Buscar usuario existente (activo o eliminado)
      const existingUser = await this.usersService.findByUsername(savedPerson.dni, manager);

      // ⚠️ Si ya existe (activo o eliminado), no crear otro
      if (existingUser) {
        console.log(
          `⚠️ El usuario staff ya existe para ${savedPerson.full_name} (person_id: ${savedPerson.id}). No se creará otro, estado: ${
            existingUser.deletedAt ? 'ELIMINADO' : 'ACTIVO'
          }`,
        );
        return savedPerson;
      }

      // ✅ Si no existe ningún usuario → crear usuario nuevo
      const cleanName = savedPerson.full_name.replace(/\s+/g, '').toLowerCase();
      const password = `${cleanName}${savedPerson.dni}`;

      await this.usersService.create({
        person_id: savedPerson.id,
        company_id: createPersonDto.company_id as number,
        user_type: savedPerson.dni,        // 👈 corregido (no debe ser el DNI)
        password,                  // UsersService se encarga de hashear internamente
      }, manager);

      console.log(
        `✅ Usuario staff creado automáticamente para ${savedPerson.full_name} (user_type: staff, username: ${savedPerson.dni}, password: ${password})`,
      );
    } catch (error) {
      console.error(
        '⚠️ Error al crear usuario staff automático:',
        error?.message || error,
      );

      // 🧠 Si el error dice "no encontrado", intentar crearlo directamente
      if (
        error?.message?.toLowerCase().includes('no encontrado') ||
        error?.message?.toLowerCase().includes('not found')
      ) {
        try {
          const cleanName = savedPerson.full_name.replace(/\s+/g, '').toLowerCase();
          const password = `${savedPerson.dni}`;

          await this.usersService.create({
            person_id: savedPerson.id,
            company_id: createPersonDto.company_id as number,
            user_type: savedPerson.dni,
            password,
          }, manager);

          console.log(
            `✅ Usuario staff creado tras detección de error previo para ${savedPerson.full_name} (username: ${savedPerson.dni})`,
          );
        } catch (err2) {
          console.error('❌ Falló la creación de usuario tras el reintento:', err2);
        }
      }

      return savedPerson;
    }
  }

  return savedPerson;
}





  async findAll(filterDto?: PersonFilterDto) {
    // Usar un objeto por defecto si filterDto es undefined
    const filters = filterDto || new PersonFilterDto();

    // Construir los filtros dinámicamente
    const where: FindOptionsWhere<Person> = {};

    if (filters.full_name) {
      where.full_name = Like(`%${filters.full_name}%`);
    }

    if (filters.email) {
      where.email = Like(`%${filters.email}%`);
    }

    if (filters.dni) {
      where.dni = Like(`%${filters.dni}%`);
    }

    if (filters.role) {
      where.role = filters.role;
    }

    // Calcular skip para paginación
    const skip = (filters.page - 1) * filters.per_page;

    // Buscar personas con filtros y paginación
    const [data, total] = await this.personRepository.findAndCount({
      where,
      relations: ['pets'], // 👈 aquí agregamos la relación
      skip,
      take: filters.per_page,
      order: {
        id: 'DESC',
      },
    });

    // Calcular metadatos de paginación
    const lastPage = Math.ceil(total / filters.per_page);

    return {
      data,
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
        prev:
          filters.page > 1
            ? `?page=${filters.page - 1}&per_page=${filters.per_page}`
            : null,
        next:
          filters.page < lastPage
            ? `?page=${filters.page + 1}&per_page=${filters.per_page}`
            : null,
      },
    };
  }

  async findOne(id: number, manager?: EntityManager): Promise<Person> {
    const repo = manager ? manager.getRepository(Person) : this.personRepository;
    const person = await repo.findOne({
      where: { id },
      relations: ['pets'], // 👈 Incluimos la relación aquí
    });

    if (!person) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }

    return person;
  }

  async update(id: number, updatePersonDto: UpdatePersonDto, manager?: EntityManager): Promise<Person> {
    const repo = manager ? manager.getRepository(Person) : this.personRepository;
    const person = await this.findOne(id, manager);

    Object.assign(person, updatePersonDto);

    return repo.save(person);
  }

  async remove(id: number): Promise<void> {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['pets'],
    });

    if (!person) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }

    if (person.pets && person.pets.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar: la persona tiene mascotas asociadas`,
      );
    }

    await this.personRepository.softDelete(id);
  }

  async findByRole(role: string, filterDto?: PersonFilterDto) {
    // Crear una nueva instancia de PersonFilterDto
    const filters = filterDto ? new PersonFilterDto() : new PersonFilterDto();

    // Copiar las propiedades de filterDto si existe
    if (filterDto) {
      Object.assign(filters, filterDto);
    }

    // Establecer el rol
    filters.role = role;

    return this.findAll(filters);
  }

  async findClients(companyId: number, filterDto?: PersonFilterDto) {
    // Usar un objeto por defecto si filterDto es undefined
    const filters = filterDto || new PersonFilterDto();

    const queryBuilder = this.personRepository.createQueryBuilder('person')
      .leftJoin('person.pets', 'pet')
      .leftJoin('pet.appointments', 'appointment')
      .leftJoin('pet.hospitalizations', 'hospitalization')
      .where('appointment.companyId = :companyId OR hospitalization.companyId = :companyId' , { companyId });
    
    if (filters.full_name) {
      queryBuilder.andWhere('person.full_name ILIKE :full_name', {
        full_name: `%${filters.full_name}%`,
      });
    }

    if (filters.email) {
      queryBuilder.andWhere('person.email ILIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    if (filters.dni) {
      queryBuilder.andWhere('person.dni ILIKE :dni', {
        dni: `%${filters.dni}%`,
      });
    }

    if (filters.role) {
      queryBuilder.andWhere('person.role = :role', { role: filters.role });
    }

    queryBuilder
      .groupBy('person.id')
      .addGroupBy('person.full_name')
      .addGroupBy('person.email')
      .addGroupBy('person.dni')
      .addGroupBy('person.phone_number')
      .addGroupBy('person.address')
      .addGroupBy('person.role')
      .addGroupBy('person.created_at')
      .addGroupBy('person.updatedAt')
      .addGroupBy('person.deletedAt');
    

    // Calcular skip para paginación
    const skip = (filters.page - 1) * filters.per_page;
    queryBuilder.skip(skip).take(filters.per_page).orderBy('person.id', 'DESC');

    // Buscar personas con filtros y paginación
    const [data, total] = await queryBuilder.getManyAndCount();

    // Calcular metadatos de paginación
    const lastPage = Math.ceil(total / filters.per_page);

    return {
      data,
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
        prev:
          filters.page > 1
            ? `?page=${filters.page - 1}&per_page=${filters.per_page}`
            : null,
        next:
          filters.page < lastPage
            ? `?page=${filters.page + 1}&per_page=${filters.per_page}`
            : null,
      },
    };
  }

  async findStaff(filterDto?: PersonFilterDto) {
    return this.findByRole('staff', filterDto);
  }
}
