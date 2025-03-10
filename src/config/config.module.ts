import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que la configuración sea accesible en toda la aplicación
      envFilePath: '.env',
    }),
  ],
})
export class AppConfigModule {}