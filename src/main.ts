import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Crear específicamente una aplicación NestExpressApplication para acceder a métodos específicos de Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configuración global de validación
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    forbidNonWhitelisted: false,
  }));

  // Habilitar CORS
  app.enableCors();
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');
  
  // Asegurarse de que el directorio de uploads existe
  const uploadDir = join(__dirname, '..', 'uploads/pets');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Configurar archivos estáticos para servir las imágenes
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  await app.listen(3000);
  console.log(`La aplicación está escuchando en: ${await app.getUrl()}`);
}
bootstrap();