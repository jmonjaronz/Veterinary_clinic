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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { Appointment } from './entities/appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() filterDto: AppointmentFilterDto,
    @Query('pet_id') petId?: string,
    @Query('veterinarian_id') veterinarianId?: string,
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    if (petId) {
      return this.appointmentsService.findByPet(+petId, filterDto);
    }

    if (veterinarianId) {
      return this.appointmentsService.findByVeterinarian(
        +veterinarianId,
        filterDto,
      );
    }

    if (status === 'upcoming') {
      return this.appointmentsService.findUpcoming(filterDto);
    }

    if (startDate && endDate) {
      return this.appointmentsService.findByDateRange(
        new Date(startDate),
        new Date(endDate),
        filterDto,
      );
    }

    return this.appointmentsService.findAll(filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('without-medical-record')
  async findWithoutMedicalRecord(
    @Query('correlative') correlative?: string,
  ): Promise<Appointment[]> {
    return this.appointmentsService.findAppointmentsWithoutMedicalRecord(
      correlative,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(+id, updateAppointmentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body('document') document?: string) {
    return this.appointmentsService.complete(+id, document);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(+id);
  }
}
