import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SpeciesService } from './species.service';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { SpeciesFilterDto } from './dto/species-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('species')
export class SpeciesController {
    constructor(private readonly speciesService: SpeciesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createSpeciesDto: CreateSpeciesDto) {
        return this.speciesService.create(createSpeciesDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() filterDto: SpeciesFilterDto) {
        return this.speciesService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.speciesService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSpeciesDto: UpdateSpeciesDto) {
        return this.speciesService.update(+id, updateSpeciesDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.speciesService.remove(+id);
    }
}