import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetFilterDto } from './dto/pet-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PetResponseDto } from './dto/pet-response.dto';

@Controller('pets')
@UseInterceptors(ClassSerializerInterceptor)
export class PetsController {
    constructor(private readonly petsService: PetsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createPetDto: CreatePetDto): Promise<PetResponseDto> {
        return this.petsService.create(createPetDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(
        @Query() filterDto: PetFilterDto,
        @Query('owner_id') ownerId?: string,
        @Query('species_id') speciesId?: string
    ): Promise<{
        data: PetResponseDto[];
        meta: any;
        links: any;
    }> {
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
    async findOne(@Param('id') id: string): Promise<PetResponseDto> {
        return this.petsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(
        @Param('id') id: string, 
        @Body() updatePetDto: UpdatePetDto
    ): Promise<PetResponseDto> {
        return this.petsService.update(+id, updatePetDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{ message: string }> {
        await this.petsService.remove(+id);
        return { message: 'Mascota eliminada correctamente' };
    }
}