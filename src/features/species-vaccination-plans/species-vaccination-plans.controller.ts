import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SpeciesVaccinationPlansService } from './species-vaccination-plans.service';
import { CreateSpeciesVaccinationPlanDto } from './dto/create-species-vaccination-plan.dto';
import { UpdateSpeciesVaccinationPlanDto } from './dto/update-species-vaccination-plan.dto';
import { SpeciesVaccinationPlanFilterDto } from './dto/species-vaccination-plan-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';

@Controller('species-vaccination-plans')
export class SpeciesVaccinationPlansController {
    constructor(private readonly speciesVaccinationPlansService: SpeciesVaccinationPlansService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createSpeciesVaccinationPlanDto: CreateSpeciesVaccinationPlanDto, @CompanyId() companyId: number) {
        return this.speciesVaccinationPlansService.create(createSpeciesVaccinationPlanDto, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query() filterDto: SpeciesVaccinationPlanFilterDto,
        @CompanyId() companyId: number,
        @Query('species_id') speciesId?: string
    ) {
        if (speciesId) {
            return this.speciesVaccinationPlansService.findBySpecies(+speciesId, companyId, filterDto);
        }
        return this.speciesVaccinationPlansService.findAll(companyId, filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @CompanyId() companyId: number) {
        return this.speciesVaccinationPlansService.findOne(+id, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string, 
        @Body() updateSpeciesVaccinationPlanDto: UpdateSpeciesVaccinationPlanDto,
        @CompanyId() companyId: number
    ) {
        return this.speciesVaccinationPlansService.update(+id, updateSpeciesVaccinationPlanDto, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @CompanyId() companyId: number) {
        return this.speciesVaccinationPlansService.remove(+id, companyId);
    }
}