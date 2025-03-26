import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetFilterDto } from './dto/pet-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pets')
export class PetsController {
    constructor(private readonly petsService: PetsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createPetDto: CreatePetDto) {
        return this.petsService.create(createPetDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query() filterDto: PetFilterDto,
        @Query('owner_id') ownerId?: string,
        @Query('species_id') speciesId?: string
    ) {
        // Si se proporcionan filtros específicos de propietario o especie
        if (ownerId) {
            return this.petsService.findByOwner(+ownerId, filterDto);
        }
        
        if (speciesId) {
            return this.petsService.findBySpecies(+speciesId, filterDto);
        }
        
        // Caso genérico con todos los filtros posibles
        return this.petsService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.petsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePetDto: UpdatePetDto) {
        return this.petsService.update(+id, updatePetDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.petsService.remove(+id);
    }
}