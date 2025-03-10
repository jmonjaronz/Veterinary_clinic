import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
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
    findAll() {
        return this.personsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('clients')
    findClients() {
        return this.personsService.findClients();
    }

    @UseGuards(JwtAuthGuard)
    @Get('staff')
    findStaff() {
        return this.personsService.findStaff();
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