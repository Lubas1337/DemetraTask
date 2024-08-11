import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BcryptService } from './bcrypt.service';
import { User } from '../users/entities/user.entity';
import jwtConfig from '../common/config/jwt.config';
import { BullModule } from '@nestjs/bull';
import { UserProcessor } from './user.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'user',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, BcryptService, UserProcessor],
  exports: [JwtModule],
})
export class AuthModule {}
