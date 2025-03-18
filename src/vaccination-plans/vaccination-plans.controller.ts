import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { VaccinationPlansService } from './vaccination-plans.service';
import { CreateVaccinationPlanDto } from './dto/create-vaccination-plan.dto';
import { UpdateVaccinationPlanDto } from './dto/update-vaccination-plan.dto';
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
    findAll(@Query('pet_id') petId?: string, @Query('status') status?: string) {
        if (petId) {
        return this.vaccinationPlansService.findByPet(+petId);
        }
        
        if (status === 'pending') {
        return this.vaccinationPlansService.findPending();
        }
        
        return this.vaccinationPlansService.findAll();
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
    @Patch(':id/complete')
    complete(@Param('id') id: string, @Body('administered_date') administered_date: Date) {
        return this.vaccinationPlansService.complete(+id, administered_date);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.vaccinationPlansService.cancel(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.vaccinationPlansService.remove(+id);
    }
}