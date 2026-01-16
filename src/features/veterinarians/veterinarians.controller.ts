import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CreateVeterinarianDto } from "./dto/create-veterinarian.dto";
import { UpdateVeterinarianDto } from "./dto/update-veterinarian.dto";
import { VeterinarianFilterDto } from "./dto/veterinarian-filter.dto";
import { VeterinariansService } from "./veterinarians.service";
import { CompanyId } from "src/common/auth/decorators/company-id.decorator";
import { JwtAuthGuard } from "src/common/auth/guards/jwt-auth.guard";

@Controller('veterinarians')
export class VeterinariansController {
    constructor(
        private readonly veterinariansService: VeterinariansService,
    ) {}
    @UseGuards(JwtAuthGuard)
    @Post()
    create(
        @Body() createVeterinarianDto: CreateVeterinarianDto,
        @CompanyId() companyId: number
    ) {
        return this.veterinariansService.create(createVeterinarianDto, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @CompanyId() companyId: number,
        @Query() filterDto: VeterinarianFilterDto
    ) {
        return this.veterinariansService.findAll(companyId, filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':veterinarianId')
    findOne(
        @Param('veterinarianId') veterinarianId: string,
        @CompanyId() companyId: number
    ) {
        return this.veterinariansService.findOne(+veterinarianId, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':veterinarianId')
    update(
        @Param('veterinarianId') veterinarianId: string,
        @CompanyId() companyId: number,
        @Body() updateVeterinarianDto: UpdateVeterinarianDto
    ) {
        return this.veterinariansService.update(+veterinarianId, companyId, updateVeterinarianDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':veterinarianId')
    remove(
        @Param('veterinarianId') veterinarianId: string,
        @CompanyId() companyId: number
    ) {
        return this.veterinariansService.remove(+veterinarianId, companyId);
    }
}