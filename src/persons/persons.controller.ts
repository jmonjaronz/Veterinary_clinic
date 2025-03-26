import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('persons')
export class PersonsController {
    constructor(private readonly personsService: PersonsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createPersonDto: CreatePersonDto) {
        return this.personsService.create(createPersonDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() filterDto: PersonFilterDto) {
        return this.personsService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('clients')
    findClients(@Query() filterDto: PersonFilterDto) {
        return this.personsService.findClients(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('staff')
    findStaff(@Query() filterDto: PersonFilterDto) {
        return this.personsService.findStaff(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.personsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
        return this.personsService.update(+id, updatePersonDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.personsService.remove(+id);
    }
}