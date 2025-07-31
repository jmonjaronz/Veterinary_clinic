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
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { HospitalizationsService } from './hospitalizations.service';
import { CreateHospitalizationDto } from './dto/create-hospitalization.dto';
import { UpdateHospitalizationDto } from './dto/update-hospitalization.dto';
import { HospitalizationFilterDto } from './dto/hospitalization-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('hospitalizations')
export class HospitalizationsController {
  constructor(
    private readonly hospitalizationsService: HospitalizationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/hospitalizations',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `hosp-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.pdf$/)) {
          return cb(
            new BadRequestException('Solo se permiten archivos PDF'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @Post()
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    // 1. Validar DTO
    const dto = plainToInstance(CreateHospitalizationDto, body);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((err) =>
        Object.values(err.constraints || {}),
      );
      throw new BadRequestException(messages);
    }

    // 2. Crear hospitalización
    const createdHospitalization =
      await this.hospitalizationsService.create(dto);

    // 3. Si hay archivo, guardar ruta del PDF
    if (file?.filename) {
      const filePath = `uploads/hospitalizations/${file.filename}`;
      await this.hospitalizationsService.savePdf(
        createdHospitalization.id,
        filePath,
      );
    }

    // 4. Retornar hospitalización actualizada
    return await this.hospitalizationsService.findOne(
      createdHospitalization.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() filterDto: HospitalizationFilterDto,
    @Query('pet_id') petId?: string,
    @Query('veterinarian_id') veterinarianId?: string,
    @Query('status') status?: string,
  ) {
    if (petId) {
      return this.hospitalizationsService.findByPet(+petId, filterDto);
    }

    if (veterinarianId) {
      return this.hospitalizationsService.findByVeterinarian(
        +veterinarianId,
        filterDto,
      );
    }

    if (status === 'active') {
      return this.hospitalizationsService.findActive(filterDto);
    }

    if (status === 'discharged') {
      return this.hospitalizationsService.findDischarged(filterDto);
    }

    return this.hospitalizationsService.findAll(filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hospitalizationsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHospitalizationDto: UpdateHospitalizationDto,
  ) {
    return this.hospitalizationsService.update(+id, updateHospitalizationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/discharge')
  discharge(
    @Param('id') id: string,
    @Body('discharge_date') dischargeDate?: Date,
  ) {
    return this.hospitalizationsService.discharge(+id, dischargeDate);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hospitalizationsService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/hospitalizations',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `hosp-${req.params.id}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.pdf$/)) {
          return cb(
            new BadRequestException('Solo se permiten archivos PDF'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.hospitalizationsService.savePdf(+id, file.path);
  }
}
