import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { Veterinarian } from './entities/veterinarian.entity';
import { PersonsModule } from '../persons/persons.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Veterinarian]),
        PersonsModule,
        HttpModule.register(    {
            timeout: 5000,
            maxRedirects: 5,
        }),
    ],
    controllers: [VeterinariansController],
    providers: [VeterinariansService],
    exports: [],
})
export class VeterinariansModule {}