import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Person } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

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
async create(createPersonDto: CreatePersonDto): Promise<Person> {
  // Crear y guardar la persona
  const person = this.personRepository.create(createPersonDto);
  const savedPerson = await this.personRepository.save(person);

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
      const existingUser = await this.usersService.findByUsername(savedPerson.dni);

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
        user_type: savedPerson.dni,        // 👈 corregido (no debe ser el DNI)
        password,                  // UsersService se encarga de hashear internamente
      });

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
            user_type: savedPerson.dni,
            password,
          });

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

  async findOne(id: number): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['pets'], // 👈 Incluimos la relación aquí
    });

    if (!person) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }

    return person;
  }

  async update(id: number, updatePersonDto: UpdatePersonDto): Promise<Person> {
    const person = await this.findOne(id);

    Object.assign(person, updatePersonDto);

    return this.personRepository.save(person);
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

  async findClients(filterDto?: PersonFilterDto) {
    return this.findByRole('cliente', filterDto);
  }

  async findStaff(filterDto?: PersonFilterDto) {
    return this.findByRole('staff', filterDto);
  }
}
