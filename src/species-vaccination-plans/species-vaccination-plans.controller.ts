import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SpeciesVaccinationPlansService } from './species-vaccination-plans.service';
import { CreateSpeciesVaccinationPlanDto } from './dto/create-species-vaccination-plan.dto';
import { UpdateSpeciesVaccinationPlanDto } from './dto/update-species-vaccination-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('species-vaccination-plans')
export class SpeciesVaccinationPlansController {
    constructor(private readonly speciesVaccinationPlansService: SpeciesVaccinationPlansService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createSpeciesVaccinationPlanDto: CreateSpeciesVaccinationPlanDto) {
        return this.speciesVaccinationPlansService.create(createSpeciesVaccinationPlanDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query('species_id') speciesId?: string) {
        if (speciesId) {
        return this.speciesVaccinationPlansService.findBySpecies(+speciesId);
        }
        return this.speciesVaccinationPlansService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.speciesVaccinationPlansService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string, 
        @Body() updateSpeciesVaccinationPlanDto: UpdateSpeciesVaccinationPlanDto
    ) {
        return this.speciesVaccinationPlansService.update(+id, updateSpeciesVaccinationPlanDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.speciesVaccinationPlansService.remove(+id);
    }
}