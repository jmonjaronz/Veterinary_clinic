import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { TimezoneInterceptor } from './timezone.interceptor';

// 🇵🇪 === Cargar variables de entorno antes de iniciar ===
dotenv.config();

// 🇵🇪 === Forzar zona horaria global a la del .env ===
process.env.TZ = process.env.TZ || 'America/Lima';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  // Crear directorios de uploads si no existen
  const uploadDirs = [
    join(__dirname, '..', 'uploads/pets'),
    join(__dirname, '..', 'uploads/consents'),
  ];
  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });


  app.useGlobalInterceptors(new TimezoneInterceptor());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`🚀 Aplicación corriendo en: ${await app.getUrl()}`);
  console.log(`🕓 Zona horaria activa: ${process.env.TZ}`);
  console.log(`📅 Fecha actual: ${new Date()}`);
}

bootstrap();
