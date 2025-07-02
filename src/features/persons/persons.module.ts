import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PersonsService } from './persons.service';
import { PersonsController } from './persons.controller';
import { Person } from './entities/person.entity';
import { DniSearchService } from './dni-search.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Person]),
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
    ],
    controllers: [PersonsController],
    providers: [PersonsService, DniSearchService],
    exports: [PersonsService],
})
export class PersonsModule {}