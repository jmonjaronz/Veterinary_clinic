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
  BadRequestException,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordFilterDto } from './dto/medical-record-filter.dto';
import { PetCompleteHistoryDto } from './dto/pet-complete-history.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { plainToInstance } from 'class-transformer';
import { MedicalRecordResponseDto } from './dto/medical-record-response.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';
import { User } from '../users/entities/user.entity';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CompanyId() companyId: number,
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
    @Req() req: { user: User },
  ): Promise<MedicalRecordResponseDto> {
    // Crear el registro médico
    const createdRecord = await this.medicalRecordsService.create(
      createMedicalRecordDto,
      req.user,
    );

    // Recargar con relaciones necesarias (pet, appointment, etc.)
    const record = await this.medicalRecordsService.findOne(createdRecord.id, companyId);

    // Transformar a DTO para controlar la salida
    return plainToInstance(MedicalRecordResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() filterDto: MedicalRecordFilterDto,
    @CompanyId() companyId: number,
    @Query('pet_id') petId?: string,
    @Query('veterinarian_id') veterinarianId?: string,
    @Query('appointment_id') appointmentId?: string,
  ) {
    if (petId) {
      return this.medicalRecordsService.findByPet(+petId, companyId, filterDto);
    }

    if (veterinarianId) {
      return this.medicalRecordsService.findByVeterinarian(
        +veterinarianId, companyId,
        filterDto,
      );
    }

    if (appointmentId) {
      return this.medicalRecordsService.findByAppointment(
        +appointmentId,
        companyId,
        filterDto,
      );
    }

    return this.medicalRecordsService.findAll(companyId, filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @CompanyId() companyId: number) {
    const record = await this.medicalRecordsService.findOne(+id, companyId);
    return plainToInstance(MedicalRecordResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('pet/:petId/complete-history')
  getPetCompleteHistory(
    @Param('petId') petId: string,
    @CompanyId() companyId: number,
    @Query('fecha_inicio') fechaInicio?: string,
    @Query('fecha_fin') fechaFin?: string,
  ): Promise<PetCompleteHistoryDto> {
    return this.medicalRecordsService.getPetCompleteHistory(
      +petId,
      companyId,
      fechaInicio,
      fechaFin,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CompanyId() companyId: number,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(+id, companyId, updateMedicalRecordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.medicalRecordsService.remove(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload-files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // hasta 10 archivos
      storage: diskStorage({
        destination: './uploads/medical-records',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `mr-${req.params.id}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Solo se permiten archivos PDF o imágenes'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFiles(
    @Param('id') id: string,
    @CompanyId() companyId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.medicalRecordsService.saveFiles(
      +id,
      files.map((f) => f.path),
      companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/remove-file')
  async removeFile(
    @Param('id') id: string,
    @CompanyId() companyId: number,
    @Query('filePath') filePath: string,
  ) {
    return this.medicalRecordsService.removeFile(+id, filePath, companyId);
  }
}
