import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { HospitalizationsService } from './hospitalizations.service';
import { CreateHospitalizationDto } from './dto/create-hospitalization.dto';
import { UpdateHospitalizationDto } from './dto/update-hospitalization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('hospitalizations')
export class HospitalizationsController {
    constructor(private readonly hospitalizationsService: HospitalizationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createHospitalizationDto: CreateHospitalizationDto) {
        return this.hospitalizationsService.create(createHospitalizationDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query('pet_id') petId?: string,
        @Query('veterinarian_id') veterinarianId?: string,
        @Query('status') status?: string
    ) {
        if (petId) {
        return this.hospitalizationsService.findByPet(+petId);
        }
        
        if (veterinarianId) {
        return this.hospitalizationsService.findByVeterinarian(+veterinarianId);
        }
        
        if (status === 'active') {
        return this.hospitalizationsService.findActive();
        }
        
        if (status === 'discharged') {
        return this.hospitalizationsService.findDischarged();
        }
        
        return this.hospitalizationsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.hospitalizationsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateHospitalizationDto: UpdateHospitalizationDto) {
        return this.hospitalizationsService.update(+id, updateHospitalizationDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/discharge')
    discharge(@Param('id') id: string, @Body('discharge_date') dischargeDate?: Date) {
        return this.hospitalizationsService.discharge(+id, dischargeDate);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.hospitalizationsService.remove(+id);
    }
}