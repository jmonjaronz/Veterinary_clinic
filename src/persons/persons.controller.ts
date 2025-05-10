import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { DniSearchService } from './dni-search.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface CreateFromDniDto {
    dni: string;
    role?: string;
}

@Controller('persons')
export class PersonsController {
    constructor(
        private readonly personsService: PersonsService,
        private readonly dniSearchService: DniSearchService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createPersonDto: CreatePersonDto) {
        return this.personsService.create(createPersonDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-from-dni')
    async createFromDni(@Body() body: CreateFromDniDto) {
        const role = body.role || 'cliente';
        
        // Verificar si la persona ya existe en la base de datos
        const existingPersons = await this.personsService.findAll({
            dni: body.dni,
            page: 1,
            per_page: 1
        });
        
        if (existingPersons.data.length > 0) {
            return {
                status: 2,
                message: 'La persona ya existe en el sistema',
                person: existingPersons.data[0]
            };
        }
        
        // Buscar la persona por DNI en la API externa
        const personData = await this.dniSearchService.searchByDni(body.dni);
        
        // Crear un DTO de persona a partir de los datos obtenidos
        const createPersonDto: CreatePersonDto = {
            full_name: personData.full_name,
            dni: body.dni,
            email: personData.email || '',
            phone_number: personData.phone_number || '',
            address: personData.address || '',
            role: role // Usar el rol proporcionado o 'cliente' por defecto
        };
        
        // Crear la persona en la base de datos
        const newPerson = await this.personsService.create(createPersonDto);
        
        return {
            status: 1,
            message: 'Persona creada exitosamente',
            person: newPerson
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-veterinarian-from-dni')
    async createVeterinarianFromDni(@Body() body: { dni: string }) {
        // Crear objeto compatible con la interfaz
        const data: CreateFromDniDto = {
            dni: body.dni,
            role: 'staff'
        };
        
        // Utilizar el método existente
        return this.createFromDni(data);
    }

    @UseGuards(JwtAuthGuard)
    @Get('find-by-dni/:dni')
    async findByDni(@Param('dni') dni: string) {
        // Buscar primero en nuestra base de datos
        const existingPersons = await this.personsService.findAll({
            dni: dni,
            page: 1,
            per_page: 1
        });
        
        if (existingPersons.data.length > 0) {
            return {
                source: 'database',
                person: existingPersons.data[0]
            };
        }
        
        // Si no existe en la base de datos, buscar en la API externa
        try {
            const personData = await this.dniSearchService.searchByDni(dni);
            return {
                source: 'api',
                person: {
                    full_name: personData.full_name,
                    dni: dni,
                    email: personData.email,
                    phone_number: personData.phone_number,
                    address: personData.address
                }
            };
        } catch {
            return {
                source: 'none',
                message: 'No se encontró información para este DNI'
            };
        }
    }

    // Endpoint temporal para debug
    @UseGuards(JwtAuthGuard)
    @Get('debug-search-raw/:dni')
    async debugSearchRaw(@Param('dni') dni: string) {
        try {
            // Obtener los datos procesados pero mostrar también los originales
            const personData = await this.dniSearchService.searchByDni(dni);
            
            return {
                dni: dni,
                processedData: personData,
                originalApiData: personData.originalData,
                // Mostrar todos los campos del objeto original
                availableFields: Object.keys(personData.originalData || {}),
                fieldValues: personData.originalData,
                // Extra: mostrar específicamente los campos de nombre
                nameFields: {
                    nombre: personData.originalData?.nombre || null,
                    apellido: personData.originalData?.apellido || null,
                    Nombre: personData.originalData?.Nombre || null,
                    Apellido: personData.originalData?.Apellido || null,
                    full_name: personData.originalData?.full_name || null,
                    name: personData.originalData?.name || null,
                    razon_social: personData.originalData?.razon_social || null,
                    NombreCompleto: personData.originalData?.NombreCompleto || null,
                    nombre_completo: personData.originalData?.nombre_completo || null,
                }
            };
        } catch (error) {
            // Manejo de errores más robusto para evitar warnings de ESLint
            if (error instanceof Error) {
                return {
                    error: true,
                    message: error.message,
                    dni: dni,
                    errorStack: error.stack
                };
            }
            
            // Manejo para errores no estándar
            return {
                error: true,
                message: String(error),
                dni: dni,
                errorStack: undefined
            };
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() filterDto: PersonFilterDto) {
        return this.personsService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('clients')
    findClients(@Query() filterDto: PersonFilterDto) {
        return this.personsService.findClients(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('staff')
    findStaff(@Query() filterDto: PersonFilterDto) {
        return this.personsService.findStaff(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.personsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
        return this.personsService.update(+id, updatePersonDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.personsService.remove(+id);
    }
}