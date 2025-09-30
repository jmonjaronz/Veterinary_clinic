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
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { Request } from 'express';

import { CreateOpinionDto } from './dto/create-opinion-medical-record.dto';
import { OpinionFilterDto } from './dto/opinion-medical-record-filter.dto';
import { OpinionService } from './opinion-medical-record.service';
import { OpinionResponseDto } from './dto/opinion-medical-records-response.dto';
import { UpdateOpinionDto } from './dto/update-opinion-medical-record.dto';

// 👇 extendemos el Request de Express para tipar req.user
interface AuthenticatedRequest extends Request {
  user: any;
}

@UseGuards(JwtAuthGuard)
@Controller('opinions')
export class OpinionController {
  constructor(private readonly opinionService: OpinionService) {}

  @Post()
  create(
    @Body() dto: CreateOpinionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<OpinionResponseDto> {
    return this.opinionService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Query() filterDto: OpinionFilterDto,
    @Query('medical_record_id') medicalRecordId?: string,
    @Query('pet_id') petId?: string,
    @Query('owner_id') ownerId?: string,
  ) {
    if (medicalRecordId) {
      return this.opinionService.findByMedicalRecord(+medicalRecordId, filterDto);
    }
    if (petId) {
      return this.opinionService.findByPet(+petId, filterDto);
    }
    if (ownerId) {
      return this.opinionService.findByOwner(+ownerId, filterDto);
    }

    return this.opinionService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<OpinionResponseDto> {
    return this.opinionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOpinionDto,
  ): Promise<OpinionResponseDto> {
    return this.opinionService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.opinionService.remove(+id);
  }
}
