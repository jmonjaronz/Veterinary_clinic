import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordFilterDto } from './dto/medical-record-filter.dto';
import { PetCompleteHistoryDto } from './dto/pet-complete-history.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { plainToInstance } from 'class-transformer';
import { MedicalRecordResponseDto } from './dto/medical-record-response.dto';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    // Crear el registro médico
    const createdRecord = await this.medicalRecordsService.create(
      createMedicalRecordDto,
    );

    // Recargar con relaciones necesarias (pet, appointment, etc.)
    const record = await this.medicalRecordsService.findOne(createdRecord.id);

    // Transformar a DTO para controlar la salida
    return plainToInstance(MedicalRecordResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() filterDto: MedicalRecordFilterDto,
    @Query('pet_id') petId?: string,
    @Query('veterinarian_id') veterinarianId?: string,
    @Query('appointment_id') appointmentId?: string,
  ) {
    if (petId) {
      return this.medicalRecordsService.findByPet(+petId, filterDto);
    }

    if (veterinarianId) {
      return this.medicalRecordsService.findByVeterinarian(
        +veterinarianId,
        filterDto,
      );
    }

    if (appointmentId) {
      return this.medicalRecordsService.findByAppointment(
        +appointmentId,
        filterDto,
      );
    }

    return this.medicalRecordsService.findAll(filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const record = await this.medicalRecordsService.findOne(+id);
    return plainToInstance(MedicalRecordResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('pet/:petId/complete-history')
  getPetCompleteHistory(
    @Param('petId') petId: string,
  ): Promise<PetCompleteHistoryDto> {
    return this.medicalRecordsService.getPetCompleteHistory(+petId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(+id, updateMedicalRecordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicalRecordsService.remove(+id);
  }
}
