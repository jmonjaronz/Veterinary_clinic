import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProcedureTypesService } from './procedure-types.service';
import { CreateProcedureTypeDto } from './dto/create-procedure-type.dto';
import { UpdateProcedureTypeDto } from './dto/update-procedure-type.dto';
import { ProcedureTypeFilterDto } from './dto/procedure-type-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('procedure-types')
export class ProcedureTypesController {
    constructor(private readonly procedureTypesService: ProcedureTypesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createProcedureTypeDto: CreateProcedureTypeDto) {
        return this.procedureTypesService.create(createProcedureTypeDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() filterDto: ProcedureTypeFilterDto) {
        return this.procedureTypesService.findAll(filterDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('active')
    findActive() {
        return this.procedureTypesService.findActive();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.procedureTypesService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProcedureTypeDto: UpdateProcedureTypeDto) {
        return this.procedureTypesService.update(+id, updateProcedureTypeDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/activate')
    activate(@Param('id') id: string) {
        return this.procedureTypesService.activate(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/deactivate')
    deactivate(@Param('id') id: string) {
        return this.procedureTypesService.deactivate(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.procedureTypesService.remove(+id);
    }
}