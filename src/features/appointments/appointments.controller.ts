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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { Appointment } from './entities/appointment.entity';
import { CompanyId } from 'src/common/auth/decorators/company-id.decorator';
import { User } from '../users/entities/user.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Req() req: {user: User}) {
    const user = req.user;
    return this.appointmentsService.create(createAppointmentDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() filterDto: AppointmentFilterDto,
    @CompanyId() companyId: number,
    @Query('pet_id') petId?: string,
    @Query('veterinarian_id') veterinarianId?: string,
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    if (petId) {
      return this.appointmentsService.findByPet(+petId, companyId, filterDto);
    }

    if (veterinarianId) {
      if (startDate && endDate) {
        return this.appointmentsService.findByVeterinarianDateRange(
          +veterinarianId,
          new Date(startDate),
          new Date(endDate),
          companyId,
          filterDto,
        );
      }else{
        return this.appointmentsService.findByVeterinarian(
        +veterinarianId,
        companyId,
        filterDto,
      );
      }
    }

    if (status === 'upcoming') {
      return this.appointmentsService.findUpcoming(companyId,filterDto);
    }

    if (startDate && endDate) {
      return this.appointmentsService.findByDateRange(
        startDate,
        endDate,
        companyId,
        filterDto,
      );
    }

    return this.appointmentsService.findAll(companyId, filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('without-medical-record')
  async findWithoutMedicalRecord(
    @CompanyId() companyId: number,
    @Query('correlative') correlative?: string,
    @Query('appointment_type') appointment_type?: string,
    @Query('type') type?: string,
  ): Promise<Appointment[]> {
    const finalType = appointment_type || type;

    return this.appointmentsService.findAppointmentsWithoutMedicalRecord(
      companyId,
      correlative,
      finalType,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.appointmentsService.findOne(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CompanyId() companyId: number,
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(+id, updateAppointmentDto, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  complete(@Param('id') id: string, @CompanyId() companyId: number, @Body('document') document?: string) {
    return this.appointmentsService.complete(+id, companyId, document);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.appointmentsService.cancel(+id, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.appointmentsService.remove(+id, companyId);
  }
}
