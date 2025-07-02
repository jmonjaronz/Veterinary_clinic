import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Crear específicamente una aplicación NestExpressApplication para acceder a métodos específicos de Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );

  // Habilitar CORS
  app.enableCors();

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');

  // Asegurarse de que los directorios de uploads existen
  const uploadDirs = [
    join(__dirname, '..', 'uploads/pets'),
    join(__dirname, '..', 'uploads/consents'),
  ];

  // Crear cada directorio si no existe
  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Configurar archivos estáticos para servir las imágenes y documentos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`La aplicación está escuchando en: ${await app.getUrl()}`);
}
bootstrap();
