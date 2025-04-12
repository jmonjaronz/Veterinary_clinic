import { Controller, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { VaccinationPlansService } from './vaccination-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';

@Controller('vaccination-records')
export class VaccinationRecordsController {
    constructor(private readonly vaccinationPlansService: VaccinationPlansService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createVaccinationRecordDto: CreateVaccinationRecordDto) {
        return this.vaccinationPlansService.addVaccinationRecord(createVaccinationRecordDto);
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