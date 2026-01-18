import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CompanyId } from "src/common/auth/decorators/company-id.decorator";
import { CreateClientDto } from "./dto/create-client.dto";
import { JwtAuthGuard } from "src/common/auth/guards/jwt-auth.guard";
import { ClientsService } from "./clients.service";
import { UpdateClientDto } from "./dto/update-client.dto";
import { ClientFilterDto } from "./dto/client-filter.dto";

@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) {}


    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createClientDto: CreateClientDto, @CompanyId() companyId: number) {
        return this.clientsService.create(createClientDto, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateClientDto: UpdateClientDto, 
        @CompanyId() companyId: number
    ) {
        return this.clientsService.update(+id, updateClientDto, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(
        @Param('id') id: string,
        @CompanyId() companyId: number
    ) {
        return this.clientsService.delete(+id, companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CompanyId() companyId: number
    ) {
        return this.clientsService.findOne(+id, companyId, ['person', 'company']);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@CompanyId() companyId: number, @Query() filterDto: ClientFilterDto) {
        return this.clientsService.findAll(companyId, filterDto);
    }
}