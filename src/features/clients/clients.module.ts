import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Client } from "./entities/client.entity";
import { HttpModule } from "@nestjs/axios";
import { ClientsController } from "./clients.controller";
import { PersonsModule } from "../persons/persons.module";
import { ClientsService } from "./clients.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Client]),
        PersonsModule,
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
    ],
    controllers: [ClientsController],
    providers: [ClientsService],
    exports: [ClientsService],
})
export class ClientsModule {}