import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordFilterDto } from './dto/medical-record-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('medical-records')
export class MedicalRecordsController {
    constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
        return this.medicalRecordsService.create(createMedicalRecordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query() filterDto: MedicalRecordFilterDto,
        @Query('pet_id') petId?: string,
        @Query('veterinarian_id') veterinarianId?: string,
        @Query('appointment_id') appointmentId?: string
    ) {
        if (petId) {
            return this.medicalRecordsService.findByPet(+petId, filterDto);
        }
        
        if (veterinarianId) {
            return this.medicalRecordsService.findByVeterinarian(+veterinarianId, filterDto);
        }
        
        if (appointmentId) {
            return this.medicalRecordsService.findByAppointment(+appointmentId, filterDto);
        }
        
        return this.medicalRecordsService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.medicalRecordsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMedicalRecordDto: UpdateMedicalRecordDto) {
        return this.medicalRecordsService.update(+id, updateMedicalRecordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.medicalRecordsService.remove(+id);
    }
}