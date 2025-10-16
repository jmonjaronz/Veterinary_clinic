import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),

          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],

          // 🔧 Configuración correcta para zona horaria Perú
          // TypeORM no tiene `timezone` para Postgres, se hace así:
          extra: {
            options: '-c timezone=America/Lima',
          },


          synchronize: !isProduction,

 
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          migrationsRun: isProduction,

          // logging: !isProduction,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
