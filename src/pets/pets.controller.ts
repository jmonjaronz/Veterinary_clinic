import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, ClassSerializerInterceptor, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetFilterDto } from './dto/pet-filter.dto';
import { UploadConsentDocumentDto } from './dto/upload-consent-document.dto';
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

    @UseGuards(JwtAuthGuard)
    @Post(':id/consent-document')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/consents',
                filename: (req, file, cb) => {
                    // Generar nombre de archivo único
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    const fileExtension = extname(file.originalname);
                    return cb(null, `${randomName}${fileExtension}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Validar tipos de archivo permitidos (PDF, imágenes)
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
                if (!allowedTypes.includes(file.mimetype)) {
                    return cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF e imágenes.'), false);
                }
                cb(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB máximo
            },
        }),
    )
    async uploadConsentDocument(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<PetResponseDto> {
        return this.petsService.uploadConsentDocument(+id, file);
    }
}