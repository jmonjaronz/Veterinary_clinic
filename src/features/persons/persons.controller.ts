import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { DniSearchService } from './dni-search.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';

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

    // NUEVO: Endpoint unificado para búsqueda e inserción por DNI
    @UseGuards(JwtAuthGuard)
    @Get('search-dni/:dni')
    async searchAndCreatePersonByDni(
        @Param('dni') dni: string, 
        @CompanyId() companyId: number,
        @Query('role') role?: string,
        @Query('create') create?: string // Query param para determinar si crear o solo buscar
    ) {
        const finalRole = role || 'cliente';
        
        // Buscar primero en nuestra base de datos
        const existingPersons = await this.personsService.findAll({
            dni: dni,
            page: 1,
            per_page: 1
        });
        
        if (existingPersons.data.length > 0) {
            return {
                status: 2,
                message: 'La persona ya existe en el sistema',
                person: existingPersons.data[0],
                source: 'database'
            };
        }
        
        // Buscar en la API externa
        try {
            const personData = await this.dniSearchService.searchByDni(dni);
            
            // Si create=true, crear la persona en la base de datos
            if (create === 'true') {
                const createPersonDto: CreatePersonDto = {
                    full_name: personData.full_name,
                    dni: dni,
                    email: personData.email || '',
                    phone_number: personData.phone_number || '',
                    address: personData.address || '',
                    role: finalRole,
                    ...(finalRole === 'staff' ? { company_id: companyId } : {}) 
                };
                
                const newPerson = await this.personsService.create(createPersonDto);
                
                return {
                    status: 1,
                    message: 'Persona creada exitosamente',
                    person: newPerson,
                    source: 'api'
                };
            } else {
                // Solo devolver los datos encontrados
                return {
                    status: 0,
                    message: 'Persona encontrada pero no creada',
                    person: {
                        full_name: personData.full_name,
                        dni: dni,
                        email: personData.email || '',
                        phone_number: personData.phone_number || '',
                        address: personData.address || '',
                        role: finalRole,
                    },
                    source: 'api'
                };
            }
        } catch {
            return {
                status: -1,
                message: 'No se encontró información para este DNI',
                source: 'none',
                dni: dni
            };
        }
    }

    // Alias para buscar veterinarios
    @UseGuards(JwtAuthGuard)
    @Get('search-staff/:dni')
    async searchStaffByDni(
        @Param('dni') dni: string,
        @CompanyId() companyId: number,
        @Query('create') create?: string
    ) {
        return this.searchAndCreatePersonByDni(dni, companyId, 'staff', create);
    }

    // Endpoint más simple para búsqueda sin crear
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
                // Extra: mostrar específicamente los campos de nombre actualizados
                nameFields: {
                    nombres: personData.originalData?.nombres || null,
                    apepat: personData.originalData?.apepat || null,
                    apemat: personData.originalData?.apemat || null,
                    full_name_constructed: personData.full_name, // Ver el nombre completo generado
                    // Backup fields
                    nombre: personData.originalData?.nombre || null,
                    apellido: personData.originalData?.apellido || null,
                    razon_social: personData.originalData?.razon_social || null,
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
    findClients(@CompanyId() companyId: number, @Query() filterDto: PersonFilterDto) {
        return this.personsService.findClients(companyId,filterDto);
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