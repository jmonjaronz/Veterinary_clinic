import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { VaccinationPlansService } from './vaccination-plans.service';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';
import { UpdateVaccinationRecordDto } from './dto/update-vaccination-record.dto';
import { VaccinationRecordFilterDto } from './dto/vaccination-record-filter.dto';

@Controller('vaccination-records')
export class VaccinationRecordsController {
    constructor(private readonly vaccinationPlansService: VaccinationPlansService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() filterDto: VaccinationRecordFilterDto) {
        return this.vaccinationPlansService.findVaccinationRecords(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createVaccinationRecordDto: CreateVaccinationRecordDto) {
        return this.vaccinationPlansService.addVaccinationRecord(createVaccinationRecordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateVaccinationRecordDto: UpdateVaccinationRecordDto
    ) {
        return this.vaccinationPlansService.updateVaccinationRecord(+id, updateVaccinationRecordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/toggle-enabled')
    toggleEnabled(
        @Param('id') id: string,
        @Body('enabled') enabled: boolean
    ) {
        return this.vaccinationPlansService.toggleVaccineEnabled(+id, enabled);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/apply')
    applyVaccine(
        @Param('id') id: string,
        @Body('administered_date') administeredDate?: Date,
        @Body('notes') notes?: string
    ) {
        return this.vaccinationPlansService.applyVaccine(+id, administeredDate, notes);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/complete')
    complete(
        @Param('id') id: string,
        @Body('administered_date') administered_date: Date
    ) {
        return this.vaccinationPlansService.completeVaccinationRecord(+id, administered_date);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.vaccinationPlansService.cancelVaccinationRecord(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/reschedule')
    reschedule(
        @Param('id') id: string,
        @Body('scheduled_date') scheduled_date: Date
    ) {
        return this.vaccinationPlansService.rescheduleVaccinationRecord(+id, scheduled_date);
    }
}