import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as https from 'https';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Obtener rutas desde variables de entorno
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;
  
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
  
  // Determinar si se debe usar HTTPS
  const useHttps = sslKeyPath && sslCertPath;
  const port = process.env.PORT || 3000;
  
  if (useHttps) {
    // Configuración HTTPS
    const httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    };
    
    const server = https.createServer(httpsOptions, app.getHttpAdapter().getInstance());
    await new Promise<void>((resolve) => {
      server.listen(port, () => {
        resolve();
      });
    });
    
    logger.log(`La aplicación está escuchando en HTTPS en el puerto ${port}`);
  } else {
    // Configuración HTTP normal
    await app.listen(port);
    logger.log(`La aplicación está escuchando en: ${await app.getUrl()}`);
  }
}

bootstrap();