import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { VaccineFilterDto } from './dto/vaccine-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vaccines')
export class VaccinesController {
    constructor(private readonly vaccinesService: VaccinesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createVaccineDto: CreateVaccineDto) {
        return this.vaccinesService.create(createVaccineDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query() filterDto: VaccineFilterDto,
        @Query('plan_id') planId?: string
    ) {
        if (planId) {
            return this.vaccinesService.findByPlan(+planId, filterDto);
        }
        return this.vaccinesService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.vaccinesService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateVaccineDto: UpdateVaccineDto) {
        return this.vaccinesService.update(+id, updateVaccineDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.vaccinesService.remove(+id);
    }
}