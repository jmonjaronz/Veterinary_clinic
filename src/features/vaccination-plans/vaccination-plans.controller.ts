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
} from '@nestjs/common';
import { VaccinationPlansService } from './vaccination-plans.service';
import { CreateVaccinationPlanDto } from './dto/create-vaccination-plan.dto';
import { UpdateVaccinationPlanDto } from './dto/update-vaccination-plan.dto';
import { VaccinationPlanFilterDto } from './dto/vaccination-plan-filter.dto';
import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';

@Controller('vaccination-plans')
export class VaccinationPlansController {
  constructor(
    private readonly vaccinationPlansService: VaccinationPlansService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createVaccinationPlanDto: CreateVaccinationPlanDto,
    @CompanyId() companyId: number,
  ) {
    return this.vaccinationPlansService.create(
      createVaccinationPlanDto,
      companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() filterDto: VaccinationPlanFilterDto,
    @CompanyId() companyId: number,
    @Query('pet_id') petId?: string,
  ) {
    if (petId) {
      return this.vaccinationPlansService.findByPet(
        +petId,
        companyId,
        filterDto,
      );
    }

    return this.vaccinationPlansService.findAll(companyId, filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.vaccinationPlansService.findOne(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVaccinationPlanDto: UpdateVaccinationPlanDto,
    @CompanyId() companyId: number,
  ) {
    return this.vaccinationPlansService.update(
      +id,
      updateVaccinationPlanDto,
      companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/activate')
  activate(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.vaccinationPlansService.activate(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.vaccinationPlansService.deactivate(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.vaccinationPlansService.remove(+id, companyId);
  }

  // Endpoints para gestionar registros de vacunación
  @UseGuards(JwtAuthGuard)
  @Post('records')
  addVaccinationRecord(
    @Body() createVaccinationRecordDto: CreateVaccinationRecordDto,
    @CompanyId() companyId: number,
  ) {
    return this.vaccinationPlansService.addVaccinationRecord(
      createVaccinationRecordDto,
      companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('records/:id/complete')
  completeRecord(
    @Param('id') id: string,
    @Body('administered_date') administered_date: Date,
    @CompanyId() companyId: number,
  ) {
    return this.vaccinationPlansService.completeVaccinationRecord(
      +id,
      companyId,
      administered_date,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('records/:id/cancel')
  cancelRecord(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.vaccinationPlansService.cancelVaccinationRecord(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('records/:id/reschedule')
  rescheduleRecord(
    @Param('id') id: string,
    @Body('scheduled_date') scheduled_date: Date,
    @CompanyId() companyId: number,
  ) {
    return this.vaccinationPlansService.rescheduleVaccinationRecord(
      +id,
      companyId,
      scheduled_date,
    );
  }
}
