import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { SurgicalConsentsController } from './surgical-consents.controller';
import { SurgicalConsentsService } from './surgical-consents.service';
import { SurgicalConsent } from './entities/surgical-consent.entity';
import { ProcedureType } from './entities/procedure-type.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Person } from '../persons/entities/person.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ProcedureTypesController } from './procedure-types.controller';
import { ProcedureTypesService } from './procedure-types.service';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurgicalConsent,
      ProcedureType,
      Pet,
      Person,
      Appointment,
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: () => {
          // Asegurar que el directorio de uploads exista
          const uploadDir = './uploads/consents';
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          return uploadDir;
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = file.originalname.split('.').pop();
          cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
        },
      }),
    }),
  ],
  controllers: [SurgicalConsentsController, ProcedureTypesController],
  providers: [SurgicalConsentsService, ProcedureTypesService],
  exports: [SurgicalConsentsService, ProcedureTypesService],
})
export class SurgicalConsentsModule {}