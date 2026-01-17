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
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';
import { User } from '../users/entities/user.entity';

// 👇 extendemos el Request de Express para tipar req.user
interface AuthenticatedRequest extends Request {
  user: User;
}

@UseGuards(JwtAuthGuard)
@Controller('opinions')
export class OpinionController {
  constructor(private readonly opinionService: OpinionService) {}

  @Post()
  create(
    @Body() dto: CreateOpinionDto,
    @Req() req: AuthenticatedRequest,
    @CompanyId() companyId: number,
  ): Promise<OpinionResponseDto> {
    return this.opinionService.create(dto, req.user, companyId);
  }

  @Get()
  findAll(
    @CompanyId() companyId: number,
    @Query() filterDto: OpinionFilterDto,
    @Query('medical_record_id') medicalRecordId?: string,
    @Query('pet_id') petId?: string,
    @Query('owner_id') ownerId?: string,
  ) {
    if (medicalRecordId) {
      return this.opinionService.findByMedicalRecord(+medicalRecordId, companyId, filterDto);
    }
    if (petId) {
      return this.opinionService.findByPet(+petId, companyId, filterDto);
    }
    if (ownerId) {
      return this.opinionService.findByOwner(+ownerId,companyId, filterDto);
    }

    return this.opinionService.findAll(companyId, filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: number): Promise<OpinionResponseDto> {
    return this.opinionService.findOne(+id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CompanyId() companyId: number,
    @Body() dto: UpdateOpinionDto,
  ): Promise<OpinionResponseDto> {
    return this.opinionService.update(+id, dto, companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.opinionService.remove(+id, companyId);
  }
}
