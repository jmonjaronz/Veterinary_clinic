import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración global de validación
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Habilitar CORS
  app.enableCors();
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');
  
  await app.listen(3000);
  console.log(`La aplicación está escuchando en: ${await app.getUrl()}`);
}
bootstrap();
