import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Hospitalization } from './entities/hospitalization.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { CreateHospitalizationDto } from './dto/create-hospitalization.dto';
import { UpdateHospitalizationDto } from './dto/update-hospitalization.dto';

@Injectable()
export class HospitalizationsService {
    constructor(
        @InjectRepository(Hospitalization)
        private readonly hospitalizationRepository: Repository<Hospitalization>,
        @InjectRepository(Pet)
        private readonly petRepository: Repository<Pet>,
        @InjectRepository(Person)
        private readonly personRepository: Repository<Person>,
    ) {}

    async create(createHospitalizationDto: CreateHospitalizationDto): Promise<Hospitalization> {
        const { pet_id, veterinarian_id, reason, consent_document, admission_date } = createHospitalizationDto;

        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: pet_id } });
        if (!pet) {
        throw new NotFoundException(`Mascota con ID ${pet_id} no encontrada`);
        }

        // Verificar si el veterinario existe y es staff
        const veterinarian = await this.personRepository.findOne({ where: { id: veterinarian_id } });
        if (!veterinarian) {
        throw new NotFoundException(`Persona con ID ${veterinarian_id} no encontrada`);
        }

        if (veterinarian.role !== 'staff') {
        throw new BadRequestException(`La persona con ID ${veterinarian_id} no es un miembro del staff`);
        }

        // Verificar si la mascota ya está hospitalizada (no tiene fecha de alta)
        const activeHospitalization = await this.hospitalizationRepository.findOne({
        where: {
            pet_id,
            discharge_date: IsNull()
        }
        });

        if (activeHospitalization) {
        throw new BadRequestException(`La mascota con ID ${pet_id} ya está hospitalizada. Debe darla de alta antes de crear una nueva hospitalización.`);
        }

        // Si hay fecha de alta, verificar que sea posterior a la fecha de admisión
        if (createHospitalizationDto.discharge_date) {
        const dischargeDate = new Date(createHospitalizationDto.discharge_date);
        const admissionDate = new Date(admission_date);
        
        if (dischargeDate < admissionDate) {
            throw new BadRequestException('La fecha de alta no puede ser anterior a la fecha de admisión');
        }
        }

        // Crear la hospitalización
        const hospitalization = this.hospitalizationRepository.create({
        pet_id,
        veterinarian_id,
        reason,
        consent_document,
        admission_date,
        discharge_date: createHospitalizationDto.discharge_date,
        });

        return this.hospitalizationRepository.save(hospitalization);
    }

    async findAll(): Promise<Hospitalization[]> {
        return this.hospitalizationRepository.find({
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { admission_date: 'DESC' }
        });
    }

    async findOne(id: number): Promise<Hospitalization> {
        const hospitalization = await this.hospitalizationRepository.findOne({
        where: { id },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        });

        if (!hospitalization) {
        throw new NotFoundException(`Hospitalización con ID ${id} no encontrada`);
        }

        return hospitalization;
    }

    async findByPet(petId: number): Promise<Hospitalization[]> {
        // Verificar si la mascota existe
        const pet = await this.petRepository.findOne({ where: { id: petId } });
        if (!pet) {
        throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
        }

        return this.hospitalizationRepository.find({
        where: { pet_id: petId },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { admission_date: 'DESC' }
        });
    }

    async findByVeterinarian(veterinarianId: number): Promise<Hospitalization[]> {
        // Verificar si el veterinario existe
        const veterinarian = await this.personRepository.findOne({ where: { id: veterinarianId } });
        if (!veterinarian) {
        throw new NotFoundException(`Persona con ID ${veterinarianId} no encontrada`);
        }

        return this.hospitalizationRepository.find({
        where: { veterinarian_id: veterinarianId },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { admission_date: 'DESC' }
        });
    }

    async findActive(): Promise<Hospitalization[]> {
        return this.hospitalizationRepository.find({
        where: {
            discharge_date: IsNull()
        },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { admission_date: 'ASC' }
        });
    }

    async findDischarged(): Promise<Hospitalization[]> {
        return this.hospitalizationRepository.find({
        where: {
            discharge_date: Not(IsNull())
        },
        relations: ['pet', 'pet.owner', 'veterinarian'],
        order: { discharge_date: 'DESC' }
        });
    }

    async update(id: number, updateHospitalizationDto: UpdateHospitalizationDto): Promise<Hospitalization> {
        const hospitalization = await this.findOne(id);
        
        // Si se intenta cambiar la mascota, verificar que exista
        if (updateHospitalizationDto.pet_id && 
            updateHospitalizationDto.pet_id !== hospitalization.pet_id) {
        const pet = await this.petRepository.findOne({ where: { id: updateHospitalizationDto.pet_id } });
        
        if (!pet) {
            throw new NotFoundException(`Mascota con ID ${updateHospitalizationDto.pet_id} no encontrada`);
        }

        // Verificar si la nueva mascota ya está hospitalizada (no tiene fecha de alta)
        const activeHospitalization = await this.hospitalizationRepository.findOne({
            where: {
            pet_id: updateHospitalizationDto.pet_id,
            discharge_date: IsNull(),
            id: Not(id) // Excluir la hospitalización actual
            }
        });

        if (activeHospitalization) {
            throw new BadRequestException(`La mascota con ID ${updateHospitalizationDto.pet_id} ya está hospitalizada.`);
        }
        }

        // Si se intenta cambiar el veterinario, verificar que exista y sea staff
        if (updateHospitalizationDto.veterinarian_id && 
            updateHospitalizationDto.veterinarian_id !== hospitalization.veterinarian_id) {
        const veterinarian = await this.personRepository.findOne({ 
            where: { id: updateHospitalizationDto.veterinarian_id } 
        });
        
        if (!veterinarian) {
            throw new NotFoundException(`Persona con ID ${updateHospitalizationDto.veterinarian_id} no encontrada`);
        }

        if (veterinarian.role !== 'staff') {
            throw new BadRequestException(`La persona con ID ${updateHospitalizationDto.veterinarian_id} no es un miembro del staff`);
        }
        }

        // Si hay fecha de alta nueva, verificar que sea posterior a la fecha de admisión
        if (updateHospitalizationDto.discharge_date) {
        const dischargeDate = new Date(updateHospitalizationDto.discharge_date);
        const admissionDate = updateHospitalizationDto.admission_date 
            ? new Date(updateHospitalizationDto.admission_date) 
            : new Date(hospitalization.admission_date);
        
        if (dischargeDate < admissionDate) {
            throw new BadRequestException('La fecha de alta no puede ser anterior a la fecha de admisión');
        }
        }

        // Verificar que la fecha de admisión no sea posterior a la fecha de alta
        if (updateHospitalizationDto.admission_date && hospitalization.discharge_date) {
        const admissionDate = new Date(updateHospitalizationDto.admission_date);
        const dischargeDate = updateHospitalizationDto.discharge_date 
            ? new Date(updateHospitalizationDto.discharge_date) 
            : new Date(hospitalization.discharge_date);
        
        if (admissionDate > dischargeDate) {
            throw new BadRequestException('La fecha de admisión no puede ser posterior a la fecha de alta');
        }
        }

        // Actualizar los campos
        Object.assign(hospitalization, updateHospitalizationDto);
        
        return this.hospitalizationRepository.save(hospitalization);
    }

    async discharge(id: number, dischargeDate: Date = new Date()): Promise<Hospitalization> {
        const hospitalization = await this.findOne(id);
        
        if (hospitalization.discharge_date) {
        throw new BadRequestException(`Esta hospitalización ya tiene fecha de alta: ${hospitalization.discharge_date}`);
        }

        const admissionDate = new Date(hospitalization.admission_date);
        if (dischargeDate < admissionDate) {
        throw new BadRequestException('La fecha de alta no puede ser anterior a la fecha de admisión');
        }

        hospitalization.discharge_date = dischargeDate;
        
        return this.hospitalizationRepository.save(hospitalization);
    }

    async remove(id: number): Promise<void> {
        const result = await this.hospitalizationRepository.delete(id);
        
        if (result.affected === 0) {
        throw new NotFoundException(`Hospitalización con ID ${id} no encontrada`);
        }
    }
}