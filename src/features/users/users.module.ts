import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Person } from '../persons/entities/person.entity';
import { PersonsModule } from '../persons/persons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User,Person]),
    forwardRef(() => PersonsModule), // 👈 Evita la dependencia circular
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
