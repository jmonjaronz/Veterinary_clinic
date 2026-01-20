import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { VaccinationPlansService } from './vaccination-plans.service';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';
import { UpdateVaccinationRecordDto } from './dto/update-vaccination-record.dto';
import { VaccinationRecordFilterDto } from './dto/vaccination-record-filter.dto';
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';

@Controller('vaccination-records')
export class VaccinationRecordsController {
  constructor(
    private readonly vaccinationPlansService: VaccinationPlansService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() filterDto: VaccinationRecordFilterDto,
    @CompanyId() companyId: number,
  ) {
    return this.vaccinationPlansService.findVaccinationRecords(
      companyId,
      filterDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createVaccinationRecordDto: CreateVaccinationRecordDto,
    @CompanyId() companyId: number,
  ) {
    return this.vaccinationPlansService.addVaccinationRecord(
      createVaccinationRecordDto,
      companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVaccinationRecordDto: UpdateVaccinationRecordDto,
    @CompanyId() companyId: number
  ) {
    return this.vaccinationPlansService.updateVaccinationRecord(
      +id,
      updateVaccinationRecordDto,
      companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle-enabled')
  toggleEnabled(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.vaccinationPlansService.toggleVaccineEnabled(+id, enabled);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/apply')
  applyVaccine(
    @Param('id') id: string,
    @CompanyId() companyId: number,
    @Body('administered_date') administeredDate?: Date,
    @Body('notes') notes?: string,
  ) {
    return this.vaccinationPlansService.applyVaccine(
      +id,
      companyId,
      administeredDate,
      notes,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body('administered_date') administered_date: Date,
    @CompanyId() companyId: number
  ) {
    return this.vaccinationPlansService.completeVaccinationRecord(
      +id,
      companyId,
      administered_date,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.vaccinationPlansService.cancelVaccinationRecord(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body('scheduled_date') scheduled_date: Date,
    @CompanyId() companyId: number,
  ) {
    console.log('Fecha Reprogramación');
    console.log(scheduled_date);
    return this.vaccinationPlansService.rescheduleVaccinationRecord(
      +id,
      companyId,
      scheduled_date,
    );
  }
}
