import {
    Controller,
    Post,
    Get,
    Param,
    Delete,
    UseInterceptors,
    UploadedFile,
    Body,
    Patch,
    ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PetImageService } from './pet-image.service';
import { UploadPetImageDto } from './dto/upload-pet-image.dto';

@Controller('pets/images')
export class PetImageController {
    constructor(private readonly petImageService: PetImageService) {}

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
            destination: './uploads/pets',
            filename: (req, file, cb) => {
                // Generar nombre de archivo único
                const randomName = Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            },
            }),
        }),
    )
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadPetImageDto: UploadPetImageDto,
        ) {
        // Convertir de manera segura el valor de isMain a booleano
        const isMain = uploadPetImageDto.isMain === true || 
            (typeof uploadPetImageDto.isMain === 'string' && uploadPetImageDto.isMain === 'true');
        
        return this.petImageService.uploadImage(
            +uploadPetImageDto.petId,
            file,
            isMain,
        );
    }

    @Get('pet/:petId')
    async findAllByPet(@Param('petId', ParseIntPipe) petId: number) {
        return this.petImageService.findAll(petId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.petImageService.findOne(id);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.petImageService.delete(id);
        return { message: 'Imagen eliminada correctamente' };
    }

    @Patch(':id/set-main')
    async setAsMain(@Param('id', ParseIntPipe) id: number) {
        return this.petImageService.setAsMain(id);
    }
}