import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { TreatmentFilterDto } from './dto/treatment-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';

@Controller('treatments')
export class TreatmentsController {
    constructor(private readonly treatmentsService: TreatmentsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createTreatmentDto: CreateTreatmentDto) {
        return this.treatmentsService.create(createTreatmentDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query() filterDto: TreatmentFilterDto,
        @Query('medical_record_id') medicalRecordId?: string,
        @Query('pet_id') petId?: string,
        @Query('veterinarian_id') veterinarianId?: string
    ) {
        if (medicalRecordId) {
            return this.treatmentsService.findByMedicalRecord(+medicalRecordId, filterDto);
        }
    
        
        return this.treatmentsService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.treatmentsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTreatmentDto: UpdateTreatmentDto) {
        return this.treatmentsService.update(+id, updateTreatmentDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.treatmentsService.remove(+id);
    }
}