import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ORMConfig } from './ormconfig';
import { UsersModule } from './users/users.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import jwtConfig from './common/config/jwt.config';
import appConfig from './common/config/app.config';
import bullConfig from './common/config/bull.config';
import redisConfig from './common/config/redis.config';
import swaggerConfig from './common/config/swagger.config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, swaggerConfig, bullConfig],
    }),    TypeOrmModule.forRoot(ORMConfig),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigType<typeof bullConfig>) => ({
        redis: config.redis,
      }),
      inject: [bullConfig.KEY],
    }),
    BullModule.registerQueue({
      name: 'user-status',
    }),

    RedisModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
