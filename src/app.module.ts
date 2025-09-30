import { Module } from '@nestjs/common';

import { UsersModule } from './features/users/users.module';
import { PersonsModule } from './features/persons/persons.module';
import { SpeciesModule } from './features/species/species.module';
import { PetsModule } from './features/pets/pets.module';
import { SpeciesVaccinationPlansModule } from './features/species-vaccination-plans/species-vaccination-plans.module';
import { VaccinationPlansModule } from './features/vaccination-plans/vaccination-plans.module';
import { VaccinesModule } from './features/vaccines/vaccines.module';

import { MedicalRecordsModule } from './features/medical-records/medical-records.module';
import { HospitalizationsModule } from './features/hospitalizations/hospitalizations.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { TreatmentsModule } from './features/treatments/treatments.module';
import { SurgicalConsentsModule } from './features/surgical-consents/surgical-consents.module';
import { ConfigModule } from '@nestjs/config';
import { AppointmentsModule } from './features/appointments/appointments.module';
import { AppConfigModule } from './common/config/config.module';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './common/auth/auth.module';
import { OpinionModule } from './features/opinion-medical-record/opinion-medical-record.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // para que esté disponible en todo el proyecto
    }),
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    PersonsModule,
    SpeciesModule,
    PetsModule,
    SpeciesVaccinationPlansModule,
    VaccinationPlansModule,
    AppointmentsModule,
    MedicalRecordsModule,
    HospitalizationsModule,
    NotificationsModule,
    VaccinesModule,
    TreatmentsModule,
    SurgicalConsentsModule,
    OpinionModule
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
