import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PersonsModule } from './persons/persons.module';
import { SpeciesModule } from './species/species.module';
import { PetsModule } from './pets/pets.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    PersonsModule,
    SpeciesModule,
    PetsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
