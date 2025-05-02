import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PersonsModule } from './persons/persons.module';
import { SpeciesModule } from './species/species.module';
import { PetsModule } from './pets/pets.module';
import { SpeciesVaccinationPlansModule } from './species-vaccination-plans/species-vaccination-plans.module';
import { VaccinationPlansModule } from './vaccination-plans/vaccination-plans.module';
import { VaccinesModule } from './vaccines/vaccines.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { HospitalizationsModule } from './hospitalizations/hospitalizations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { SurgicalConsentsModule } from './surgical-consents/surgical-consents.module';

@Module({
  imports: [
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
    SurgicalConsentsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
