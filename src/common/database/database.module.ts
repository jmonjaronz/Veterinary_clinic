import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService estará disponible globalmente
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),

          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],

          timezone: '-05:00', // 🇵🇪 Fuerza hora local de Perú
          extra: {
            options: '-c timezone=America/Lima', // 🇵🇪
          },
          // Solo sincroniza en desarrollo
          synchronize: !isProduction,

          // Ejecutar migraciones automáticamente en producción
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          migrationsRun: isProduction,

          // Opcional: solo muestra logs en desarrollo
          // logging: !isProduction,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
