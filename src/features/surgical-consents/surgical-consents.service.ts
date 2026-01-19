import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { SurgicalConsent } from './entities/surgical-consent.entity';
import { ProcedureType } from './entities/procedure-type.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { CreateSurgicalConsentDto } from './dto/create-surgical-consent.dto';
import { UpdateSurgicalConsentDto } from './dto/update-surgical-consent.dto';
import { SurgicalConsentFilterDto } from './dto/surgical-consent-filter.dto';
import { SurgicalConsentResponseDto } from './dto/surgical-consent-response.dto';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class SurgicalConsentsService {
    constructor(
        @InjectRepository(SurgicalConsent)
        private readonly surgicalConsentRepository: Repository<SurgicalConsent>,
        @InjectRepository(ProcedureType)
        private readonly procedureTypeRepository: Repository<ProcedureType>,
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
        @InjectRepository(Veterinarian)
        private readonly veterinarianRepository: Repository<Veterinarian>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly configService: ConfigService,
        private readonly clientService: ClientsService
    ) {}

    async create(createSurgicalConsentDto: CreateSurgicalConsentDto, companyId: number): Promise<SurgicalConsentResponseDto> {
        const { 
            appointment_id, 
            pet_id, 
            owner_id, 
            veterinarian_id, 
            procedure_type_id,
            custom_procedure_type,
            scheduled_date 
        } = createSurgicalConsentDto;

        // 1. Validar que la cita existe
        const appointment = await this.appointmentRepository.findOne({ 
            where: { id: appointment_id, companyId } 
        });
        if (!appointment) {
            throw new NotFoundException(`Cita con ID ${appointment_id} no encontrada`);
        }

        // 2. Validar que la mascota existe
        const pet = await this.petRepository.findOne({ 
            where: { id: pet_id, owner: { companyId} },
            relations: ['owner'] 
        });
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
        }

        // 3. Validar que el propietario existe y es su mascota
        const clientWithPets = await this.clientService.findOne(owner_id, companyId, ['pets']);

        const hasPet = clientWithPets.pets.some(p => p.id === pet_id)
        if (!hasPet) {
            throw new BadRequestException(`La mascota con ID ${pet_id} no pertenece al propietario con ID ${owner_id}`);
        }


        // 4. Validar que el veterinario existe 
        const veterinarian = await this.veterinarianRepository.findOne({ 
            where: { personId: veterinarian_id, companyId } 
        });
        if (!veterinarian) {
            throw new NotFoundException(`Veterinario con ID ${veterinarian_id} no encontrado`);
        }

        // 6. Validar el tipo de procedimiento o el procedimiento personalizado
        let procedureType: ProcedureType | null = null;
        if (procedure_type_id) {
            procedureType = await this.procedureTypeRepository.findOne({ 
                where: { id: procedure_type_id } 
            });
            if (!procedureType) {
                throw new NotFoundException(`Tipo de procedimiento con ID ${procedure_type_id} no encontrado`);
            }
            
            // Verificar que el procedimiento esté activo
            if (!procedureType.is_active) {
                throw new BadRequestException(`El tipo de procedimiento con ID ${procedure_type_id} no está activo`);
            }
        } else if (!custom_procedure_type) {
            throw new BadRequestException(`Debe proporcionar un tipo de procedimiento o un procedimiento personalizado`);
        }

        // 7. Validar que la fecha programada sea futura
        const currentDate = new Date();
        const scheduledDate = new Date(scheduled_date);
        
        if (scheduledDate < currentDate) {
            throw new BadRequestException(`La fecha programada debe ser posterior a la fecha actual`);
        }

        // 8. Verificar si ya existe un consentimiento para esta cita
        const existingConsent = await this.surgicalConsentRepository.findOne({
            where: { appointment_id, companyId }
        });

        if (existingConsent) {
            throw new ConflictException(`Ya existe un consentimiento para la cita con ID ${appointment_id}`);
        }

        // 9. Crear el consentimiento
        const surgicalConsent = this.surgicalConsentRepository.create({
            ...createSurgicalConsentDto,
            status: 'pendiente',
            companyId
        });

        const savedConsent = await this.surgicalConsentRepository.save(surgicalConsent);
        
        // 10. Buscar el consentimiento guardado con sus relaciones para transformarlo
        return this.findOne(savedConsent.id, companyId);
    }

    async findAll(companyId: number, filterDto?: SurgicalConsentFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new SurgicalConsentFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.surgicalConsentRepository
            .createQueryBuilder('consent')
            .leftJoinAndSelect('consent.appointment', 'appointment')
            .leftJoinAndSelect('consent.pet', 'pet')
            .leftJoinAndSelect('consent.owner', 'owner')
            .leftJoinAndSelect('owner.person', 'owner_person')
            .leftJoinAndSelect('consent.veterinarian', 'veterinarian')
            .leftJoinAndSelect('veterinarian.person', 'veterinarian_person')
            .leftJoinAndSelect('consent.procedureType', 'procedureType')
            .where('consent.companyId = :companyId', { companyId });

        // Aplicar filtros básicos
        if (filters.appointment_id) {
            queryBuilder.andWhere('consent.appointment_id = :appointmentId', { appointmentId: filters.appointment_id });
        }

        if (filters.pet_id) {
            queryBuilder.andWhere('consent.pet_id = :petId', { petId: filters.pet_id });
        }

        if (filters.owner_id) {
            queryBuilder.andWhere('consent.owner_id = :ownerId', { ownerId: filters.owner_id });
        }

        if (filters.veterinarian_id) {
            queryBuilder.andWhere('consent.veterinarian_id = :vetId', { vetId: filters.veterinarian_id });
        }

        if (filters.procedure_type_id) {
            queryBuilder.andWhere('consent.procedure_type_id = :procedureTypeId', { procedureTypeId: filters.procedure_type_id });
        }

        if (filters.status) {
            queryBuilder.andWhere('consent.status = :status', { status: filters.status });
        }

        // Filtro por texto para procedimiento personalizado
        if (filters.custom_procedure_type) {
            queryBuilder.andWhere('consent.custom_procedure_type ILIKE :customType', { customType: `%${filters.custom_procedure_type}%` });
        }

        // Filtros de rango para fechas
        if (filters.scheduled_date_start && filters.scheduled_date_end) {
            queryBuilder.andWhere('consent.scheduled_date BETWEEN :schedStart AND :schedEnd', {
                schedStart: filters.scheduled_date_start,
                schedEnd: filters.scheduled_date_end
            });
        } else if (filters.scheduled_date_start) {
            queryBuilder.andWhere('consent.scheduled_date >= :schedStart', { schedStart: filters.scheduled_date_start });
        } else if (filters.scheduled_date_end) {
            queryBuilder.andWhere('consent.scheduled_date <= :schedEnd', { schedEnd: filters.scheduled_date_end });
        }

        if (filters.created_at_start && filters.created_at_end) {
            queryBuilder.andWhere('consent.created_at BETWEEN :createStart AND :createEnd', {
                createStart: filters.created_at_start,
                createEnd: filters.created_at_end
            });
        } else if (filters.created_at_start) {
            queryBuilder.andWhere('consent.created_at >= :createStart', { createStart: filters.created_at_start });
        } else if (filters.created_at_end) {
            queryBuilder.andWhere('consent.created_at <= :createEnd', { createEnd: filters.created_at_end });
        }

        // Filtros para entidades relacionadas
        if (filters.pet_name) {
            queryBuilder.andWhere('pet.name ILIKE :petName', { petName: `%${filters.pet_name}%` });
        }

        if (filters.owner_name) {
            queryBuilder.andWhere('owner_person.full_name ILIKE :ownerName', { ownerName: `%${filters.owner_name}%` });
        }

        if (filters.veterinarian_name) {
            queryBuilder.andWhere('veterinarian_person.full_name ILIKE :vetName', { vetName: `%${filters.veterinarian_name}%` });
        }

        // Filtro para documento firmado
        if (filters.has_signed_document === 'yes') {
            queryBuilder.andWhere('consent.signed_document IS NOT NULL');
        } else if (filters.has_signed_document === 'no') {
            queryBuilder.andWhere('consent.signed_document IS NULL');
        }

        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('consent.scheduled_date', 'DESC')
            .skip(skip)
            .take(filters.per_page);
        
        // Ejecutar la consulta
        const [data, total] = await queryBuilder.getManyAndCount();
        
        // Transformar los datos para incluir las URLs de los documentos firmados
        const transformedData = data.map(consent => this.transformConsentResponse(consent));
        
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

    async findOne(id: number, companyId: number): Promise<SurgicalConsentResponseDto> {
        const consent = await this.surgicalConsentRepository.findOne({
            where: { id, companyId },
            relations: ['appointment', 'pet', 'owner', 'owner.person', 'veterinarian', 'procedureType'],
        });
        
        if (!consent) {
            throw new NotFoundException(`Consentimiento quirúrgico con ID ${id} no encontrado`);
        }
        
        return this.transformConsentResponse(consent);
    }

    async findByPet(petId: number, companyId: number, filterDto?: SurgicalConsentFilterDto): Promise<any> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne(
            { 
                where: { id: petId, owner: { companyId } }, 
                relations: ['owner'] 
            }
        );
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new SurgicalConsentFilterDto();
        
        // Establecer el ID de la mascota en los filtros
        filters.pet_id = petId;
        
        // Usar el método findAll con los filtros
        return this.findAll(companyId, filters);
    }
    
    async findByOwner(ownerId: number, companyId: number, filterDto?: SurgicalConsentFilterDto): Promise<any> {
        // Verificar si el propietario existe
        await this.clientService.findOne(ownerId, companyId, undefined, `Propietario con ID ${ownerId} no encontrado`);

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new SurgicalConsentFilterDto();
        
        // Establecer el ID del propietario en los filtros
        filters.owner_id = ownerId;
        
        // Usar el método findAll con los filtros
        return this.findAll(companyId, filters);
    }
    
    async findByVeterinarian(veterinarianId: number, companyId: number, filterDto?: SurgicalConsentFilterDto): Promise<any> {
        // Verificar si el veterinario existe
        const veterinarian = await this.veterinarianRepository.findOne({ where: { personId: veterinarianId, companyId } });
        if (!veterinarian) {
            throw new NotFoundException(`Veterinario con ID ${veterinarianId} no encontrado`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new SurgicalConsentFilterDto();
        
        // Establecer el ID del veterinario en los filtros
        filters.veterinarian_id = veterinarianId;
        
        // Usar el método findAll con los filtros
        return this.findAll(companyId, filters);
    }
    
    async findByStatus(status: string, companyId:number, filterDto?: SurgicalConsentFilterDto): Promise<any> {
        // Validar el estado
        if (!['pendiente', 'firmado', 'cancelado'].includes(status)) {
            throw new BadRequestException(`Estado inválido: ${status}. Debe ser "pendiente", "firmado" o "cancelado"`);
        }

        // Crear una copia del filtro o uno nuevo si no hay
        const filters = filterDto ? { ...filterDto } : new SurgicalConsentFilterDto();
        
        // Establecer el estado en los filtros
        filters.status = status;
        
        // Usar el método findAll con los filtros
        return this.findAll(companyId, filters);
    }

    async update(id: number, updateSurgicalConsentDto: UpdateSurgicalConsentDto, companyId: number): Promise<SurgicalConsentResponseDto> {
        const consent = await this.surgicalConsentRepository.findOne({
            where: { id, companyId },
            relations: ['appointment', 'pet', 'owner', 'veterinarian', 'procedureType'],
        });
        
        if (!consent) {
            throw new NotFoundException(`Consentimiento quirúrgico con ID ${id} no encontrado`);
        }

        // No permitir ediciones si el estado es firmado o cancelado
        if (consent.status === 'firmado' || consent.status === 'cancelado') {
            throw new BadRequestException(`No se puede editar un consentimiento en estado ${consent.status}`);
        }

        // Validaciones específicas para los campos que se intentan actualizar
        
        // 1. Validar cita si se intenta cambiar
        if (updateSurgicalConsentDto.appointment_id && 
            updateSurgicalConsentDto.appointment_id !== consent.appointment_id) {
            const appointment = await this.appointmentRepository.findOne({ 
                where: { id: updateSurgicalConsentDto.appointment_id, companyId } 
            });
            
            if (!appointment) {
                throw new NotFoundException(`Cita con ID ${updateSurgicalConsentDto.appointment_id} no encontrada`);
            }

            // Verificar si ya existe un consentimiento para esta cita
            const existingConsent = await this.surgicalConsentRepository.findOne({
                where: { 
                    appointment_id: updateSurgicalConsentDto.appointment_id,
                    id: Not(id), // Excluir el consentimiento actual
                    companyId
                }
            });

            if (existingConsent) {
                throw new ConflictException(`Ya existe un consentimiento para la cita con ID ${updateSurgicalConsentDto.appointment_id}`);
            }
        }

        // 2. Validar mascota si se intenta cambiar
        if (updateSurgicalConsentDto.pet_id && 
            updateSurgicalConsentDto.pet_id !== consent.pet_id) {
            const pet = await this.petRepository.findOne({ 
                where: { id: updateSurgicalConsentDto.pet_id, owner: { companyId } },
                relations: ['owner']
            });
            
            if (!pet) {
                throw new NotFoundException(`Mascota con ID ${updateSurgicalConsentDto.pet_id} no encontrada`);
            }

            // Si se cambia la mascota pero no el propietario, verificar que pertenezca al mismo propietario
            const ownerId = updateSurgicalConsentDto.owner_id || consent.owner_id;
            if (pet.owner_id !== ownerId) {
                throw new BadRequestException(`La mascota con ID ${updateSurgicalConsentDto.pet_id} no pertenece al propietario con ID ${ownerId}`);
            }
        }

        // 3. Validar propietario si se intenta cambiar
        if (updateSurgicalConsentDto.owner_id && 
            updateSurgicalConsentDto.owner_id !== consent.owner_id) {
            await this.clientService.findOne(updateSurgicalConsentDto.owner_id, companyId, undefined, `Propietario con ID ${updateSurgicalConsentDto.owner_id} no encontrado`);
            
            // Si se cambia el propietario pero no la mascota, verificar que la mascota pertenezca al nuevo propietario
            const petId = updateSurgicalConsentDto.pet_id || consent.pet_id;
            const pet = await this.petRepository.findOne({ 
                where: { id: petId, owner: { companyId } },
                relations: ['owner']
            });

            if(!pet) {
                throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
            }
            
            if (pet.owner_id !== updateSurgicalConsentDto.owner_id) {
                throw new BadRequestException(`La mascota con ID ${petId} no pertenece al propietario con ID ${updateSurgicalConsentDto.owner_id}`);
            }
        }

        // 4. Validar veterinario si se intenta cambiar
        if (updateSurgicalConsentDto.veterinarian_id && 
            updateSurgicalConsentDto.veterinarian_id !== consent.veterinarian_id) {
            const veterinarian = await this.veterinarianRepository.findOne({ 
                where: { personId: updateSurgicalConsentDto.veterinarian_id, companyId } 
            });
            
            if (!veterinarian) {
                throw new NotFoundException(`Veterinario con ID ${updateSurgicalConsentDto.veterinarian_id} no encontrado`);
            }
        }

        // 5. Validar tipo de procedimiento si se intenta cambiar
        if (updateSurgicalConsentDto.procedure_type_id && 
            updateSurgicalConsentDto.procedure_type_id !== consent.procedure_type_id) {
            const procedureType = await this.procedureTypeRepository.findOne({ 
                where: { id: Number(updateSurgicalConsentDto.procedure_type_id) }
            });
            
            if (!procedureType) {
                throw new NotFoundException(`Tipo de procedimiento con ID ${updateSurgicalConsentDto.procedure_type_id} no encontrado`);
            }
        
            // Verificar que el procedimiento esté activo
            if (!procedureType.is_active) {
                throw new BadRequestException(`El tipo de procedimiento con ID ${updateSurgicalConsentDto.procedure_type_id} no está activo`);
            }
        }

        // 6. Validar fecha programada si se intenta cambiar
        if (updateSurgicalConsentDto.scheduled_date) {
            const scheduledDate = new Date(updateSurgicalConsentDto.scheduled_date);
            const currentDate = new Date();
            
            if (scheduledDate < currentDate) {
                throw new BadRequestException(`La fecha programada debe ser posterior a la fecha actual`);
            }
        }

        // Actualizar campos
        Object.assign(consent, updateSurgicalConsentDto);
        
        await this.surgicalConsentRepository.save(consent);
        
        // Volver a buscar el consentimiento con sus relaciones para transformarlo
        return this.findOne(id, companyId);
    }

    async cancel(id: number, companyId: number): Promise<SurgicalConsentResponseDto> {
        const consent = await this.findOne(id, companyId);
        
        if (consent.status === 'cancelado') {
            throw new BadRequestException(`Este consentimiento ya está cancelado`);
        }

        if (consent.status === 'firmado') {
            throw new BadRequestException(`No se puede cancelar un consentimiento firmado`);
        }

        // Actualizar estado a cancelado
        await this.surgicalConsentRepository.update({ id, companyId },  { status: 'cancelado' });
        
        // Retornar el consentimiento actualizado
        return this.findOne(id, companyId);
    }

    async remove(id: number, companyId: number): Promise<void> {
        const consent = await this.findOne(id, companyId);
        
        // Si tiene un documento firmado, eliminarlo primero
        if (consent.signed_document) {
            const filePath = path.join(
                __dirname, 
                '..', 
                '..', 
                'uploads/consents', 
                consent.signed_document.replace('uploads/consents/', '')
            );
            
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error(`Error al eliminar el documento firmado: ${error}`);
            }
        }

        const result = await this.surgicalConsentRepository.softDelete({ id, companyId });
        
        if (result.affected === 0) {
            throw new NotFoundException(`Consentimiento quirúrgico con ID ${id} no encontrado`);
        }
    }

    async generateConsentPdf(id: number, companyId: number): Promise<{ fileName: string, filePath: string }> {
        const consent = await this.surgicalConsentRepository.findOne({
            where: { id, companyId },
            relations: ['pet', 'pet.species', 'owner', 'owner.person', 'veterinarian', 'procedureType'],
        });
        
        if (!consent) {
            throw new NotFoundException(`Consentimiento quirúrgico con ID ${id} no encontrado`);
        }

        // En lugar de generar el PDF aquí, usaremos un servicio externo o una librería específica
        // Por ahora, crearemos un archivo HTML simple que luego podrá convertirse a PDF
        
        const procedureTypeText = consent.procedureType 
            ? consent.procedureType.name
            : consent.custom_procedure_type;
            
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Consentimiento Quirúrgico</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header h1 {
                    color: #662d91;
                }
                .data-box {
                    border: 1px solid #000;
                    padding: 10px;
                    margin-bottom: 20px;
                }
                .signature-line {
                    margin-top: 50px;
                    border-top: 1px solid #000;
                    width: 300px;
                    margin-left: auto;
                    margin-right: auto;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CONSENTIMIENTO INFORMADO</h1>
                <h2>Procedimiento quirúrgico</h2>
            </div>
            
            <div class="data-box">
                <p><strong>Propietario:</strong> ${consent.owner.person.full_name}</p>
                <p><strong>Hora:</strong> ${new Date().getHours()}:${new Date().getMinutes()}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="data-box">
                <p><strong>Paciente:</strong> ${consent.pet.name}</p>
                <p><strong>Especie:</strong> ${consent.pet.species?.name || 'No especificada'}</p>
                <p><strong>Raza:</strong> ${consent.pet.breed || 'No especificada'}</p>
                <p><strong>Sexo:</strong> ${consent.pet.sex || 'No especificado'}</p>
                <p><strong>Edad:</strong> ${consent.pet.age ? `${consent.pet.age} meses` : 'No especificada'}</p>
            </div>
            
            <p>Presta su conformidad y autoriza a: <strong>${consent.veterinarian.person.full_name}</strong></p>
            <p>y a quien se designe, para intervenir quirúrgicamente el animal cuyos datos han sido especificados en este documento, para realizar: <strong>${procedureTypeText}</strong></p>
            <p>y todo otro procedimiento médico/quirúrgico, destinado a procurar salvaguardar la vida del animal y/o procurar mejorar y/o recuperar la salud del mismo.</p>
            
            <h3>Postquirúrgico:</h3>
            <p>Después de la cirugía su animal puede presentar zonas rasuradas, generalmente en las extremidades. Esto lo realizamos para permitir la visualización y el acceso limpio a las venas por las cuales se inyectará el fármaco anestésico. Un tubo se introduce generalmente en la tráquea para facilitar la respiración y administración de los vapores anestésicos. Esto puede dar lugar a una tos temporal, algunos días después de la anestesia. Es recomendable que el animal en casa pueda estar en lugares donde pueda descansar y mantenerse ventilado.</p>
            
            <p>Asimismo, deja constancia y acepta de forma</p>
            
            <div class="signature-line">
                <p>FIRMA</p>
            </div>
            
            <div class="signature-line">
                <p>NOMBRE DEL PROPIETARIO</p>
            </div>
        </body>
        </html>
        `;
        
        // Crear un archivo temporal para el HTML
        const fileName = `consent_${id}_${Date.now()}.html`;
        const dirPath = path.join(__dirname, '..', '..', 'uploads/temp');
        const filePath = path.join(dirPath, fileName);
        
        // Asegurarse de que el directorio existe
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Escribir el archivo HTML
        fs.writeFileSync(filePath, htmlContent);
        
        return { fileName, filePath };
    }

    async uploadSignedDocument(id: number, file: Express.Multer.File, companyId: number): Promise<SurgicalConsentResponseDto> {
        const consent = await this.findOne(id, companyId);
        
        if (consent.status === 'cancelado') {
            throw new BadRequestException(`No se puede subir un documento firmado para un consentimiento cancelado`);
        }

        if (consent.status === 'firmado' && consent.signed_document) {
            // Si ya existe un documento firmado, eliminarlo
            const oldFilePath = path.join(
                __dirname, 
                '..', 
                '..', 
                'uploads/consents', 
                consent.signed_document.replace('uploads/consents/', '')
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
        await this.surgicalConsentRepository.update({ id, companyId }, {
            signed_document: `uploads/consents/${file.filename}`,
            status: 'firmado'
        });
        
        // Retornar el consentimiento actualizado
        return this.findOne(id, companyId);
    }

    // Método privado para transformar la respuesta
    private transformConsentResponse(consent: SurgicalConsent): SurgicalConsentResponseDto {
        const procedureTypeName = consent.procedureType 
            ? consent.procedureType.name
            : consent.custom_procedure_type;
    
        // Crear una copia para evitar modificar la entidad original
        const responseDto: SurgicalConsentResponseDto = {
            ...consent,
            signedDocumentUrl: consent.signed_document 
                ? `/uploads/consents/${consent.signed_document.replace('uploads/consents/', '')}`
                : null,
            procedureTypeName: procedureTypeName
        };
        
        return responseDto;
    }
}