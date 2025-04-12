import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { VaccinationPlansService } from './vaccination-plans.service';
import { CreateVaccinationPlanDto } from './dto/create-vaccination-plan.dto';
import { UpdateVaccinationPlanDto } from './dto/update-vaccination-plan.dto';
import { VaccinationPlanFilterDto } from './dto/vaccination-plan-filter.dto';
import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vaccination-plans')
export class VaccinationPlansController {
    constructor(private readonly vaccinationPlansService: VaccinationPlansService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createVaccinationPlanDto: CreateVaccinationPlanDto) {
        return this.vaccinationPlansService.create(createVaccinationPlanDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query() filterDto: VaccinationPlanFilterDto,
        @Query('pet_id') petId?: string
    ) {
        if (petId) {
            return this.vaccinationPlansService.findByPet(+petId, filterDto);
        }
        
        return this.vaccinationPlansService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.vaccinationPlansService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateVaccinationPlanDto: UpdateVaccinationPlanDto) {
        return this.vaccinationPlansService.update(+id, updateVaccinationPlanDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/activate')
    activate(@Param('id') id: string) {
        return this.vaccinationPlansService.activate(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/deactivate')
    deactivate(@Param('id') id: string) {
        return this.vaccinationPlansService.deactivate(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.vaccinationPlansService.remove(+id);
    }

    // Endpoints para gestionar registros de vacunación
    @UseGuards(JwtAuthGuard)
    @Post('records')
    addVaccinationRecord(@Body() createVaccinationRecordDto: CreateVaccinationRecordDto) {
        return this.vaccinationPlansService.addVaccinationRecord(createVaccinationRecordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('records/:id/complete')
    completeRecord(
        @Param('id') id: string,
        @Body('administered_date') administered_date: Date
    ) {
        return this.vaccinationPlansService.completeVaccinationRecord(+id, administered_date);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('records/:id/cancel')
    cancelRecord(@Param('id') id: string) {
        return this.vaccinationPlansService.cancelVaccinationRecord(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('records/:id/reschedule')
    rescheduleRecord(
        @Param('id') id: string,
        @Body('scheduled_date') scheduled_date: Date
    ) {
        return this.vaccinationPlansService.rescheduleVaccinationRecord(+id, scheduled_date);
    }
}