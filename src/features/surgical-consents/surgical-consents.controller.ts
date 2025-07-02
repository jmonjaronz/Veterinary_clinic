import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseGuards, 
    Query, 
    UseInterceptors, 
    UploadedFile, 
    Res 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';  
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { SurgicalConsentsService } from './surgical-consents.service';
import { CreateSurgicalConsentDto } from './dto/create-surgical-consent.dto';
import { UpdateSurgicalConsentDto } from './dto/update-surgical-consent.dto';
import { SurgicalConsentFilterDto } from './dto/surgical-consent-filter.dto';

@Controller('surgical-consents')
export class SurgicalConsentsController {
    constructor(private readonly surgicalConsentsService: SurgicalConsentsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createSurgicalConsentDto: CreateSurgicalConsentDto) {
        return this.surgicalConsentsService.create(createSurgicalConsentDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() filterDto: SurgicalConsentFilterDto) {
        return this.surgicalConsentsService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.surgicalConsentsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('pet/:petId')
    findByPet(
        @Param('petId') petId: string,
        @Query() filterDto: SurgicalConsentFilterDto
    ) {
        return this.surgicalConsentsService.findByPet(+petId, filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('owner/:ownerId')
    findByOwner(
        @Param('ownerId') ownerId: string,
        @Query() filterDto: SurgicalConsentFilterDto
    ) {
        return this.surgicalConsentsService.findByOwner(+ownerId, filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('veterinarian/:veterinarianId')
    findByVeterinarian(
        @Param('veterinarianId') veterinarianId: string,
        @Query() filterDto: SurgicalConsentFilterDto
    ) {
        return this.surgicalConsentsService.findByVeterinarian(+veterinarianId, filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('status/:status')
    findByStatus(
        @Param('status') status: string,
        @Query() filterDto: SurgicalConsentFilterDto
    ) {
        return this.surgicalConsentsService.findByStatus(status, filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/pdf')
    async generatePdf(@Param('id') id: string, @Res() res: Response) {
        const { fileName, filePath } = await this.surgicalConsentsService.generateConsentPdf(+id);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error al descargar el archivo:', err);
            }
        });
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateSurgicalConsentDto: UpdateSurgicalConsentDto
    ) {
        return this.surgicalConsentsService.update(+id, updateSurgicalConsentDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.surgicalConsentsService.cancel(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/upload-signed')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/consents',
                filename: (req, file, cb) => {
                    // Generar un nombre único para el archivo
                    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    const ext = extname(file.originalname);
                    cb(null, `consent-${req.params.id}-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Verificar que el archivo sea PDF, JPG o PNG
                const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
                const ext = extname(file.originalname).toLowerCase();
                if (allowedExtensions.includes(ext)) {
                    cb(null, true);
                } else {
                    cb(new Error('Formato de archivo no válido. Solo se permiten PDF, JPG/JPEG y PNG.'), false);
                }
            },
            limits: {
            fileSize: 5 * 1024 * 1024, // 5MB límite de tamaño
            },
        }),
    )
    uploadSignedDocument(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.surgicalConsentsService.uploadSignedDocument(+id, file);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.surgicalConsentsService.remove(+id);
    }
}