import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { VaccineFilterDto } from './dto/vaccine-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';

@Controller('vaccines')
export class VaccinesController {
    constructor(private readonly vaccinesService: VaccinesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createVaccineDto: CreateVaccineDto, @CompanyId() companyId: number) {
        return this.vaccinesService.create(createVaccineDto, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query() filterDto: VaccineFilterDto,
        @CompanyId() companyId: number,
        @Query('plan_id') planId?: string
    ) {
        if (planId) {
            return this.vaccinesService.findByPlan(+planId, companyId, filterDto);
        }
        return this.vaccinesService.findAll(companyId, filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @CompanyId() companyId: number) {
        return this.vaccinesService.findOne(+id, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateVaccineDto: UpdateVaccineDto, @CompanyId() companyId: number) {
        return this.vaccinesService.update(+id, updateVaccineDto, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @CompanyId() companyId: number) {
        return this.vaccinesService.remove(+id, companyId);
    }
}