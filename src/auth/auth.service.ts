import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import jwtConfig from '../common/config/jwt.config';
import { ActiveUserData } from '../common/interfaces/active-user-data.interface';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { BcryptService } from './bcrypt.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
    @InjectQueue('user') private readonly userQueue: Queue,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = signUpDto;

    try {
      const existingUser = await this.userRepository.findOne({ where: { email } });
      await this.userQueue.add('updateUserStatus', { userId: existingUser.id }, { delay: 10000 });
      if (existingUser) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'ERR_USER_EMAIL_EXISTS',
        });
      }


      const user = new User();
      user.email = email;
      user.password = await this.bcryptService.hash(password);
      await this.userRepository.save(user);

      return await this.generateTokens(user);
    } catch (error) {
      throw error;
    }
  }



  async signIn(signInDto: SignInDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = signInDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid email');
    }

    const isPasswordMatch = await this.bcryptService.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid password');
    }

    return await this.generateTokens(user);
  }

  async signOut(userId: string): Promise<void> {
    await this.redisService.delete(`user-${userId}`);
  }

  async generateTokens(user: Partial<User>): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenId = randomUUID();
    const refreshTokenId = randomUUID();

    await this.redisService.insert(`user-${user.id}`, { tokenId, refreshTokenId });

    const accessToken = await this.jwtService.signAsync(
      {
        id: user.id,
        email: user.email,
        tokenId,
      } as ActiveUserData,
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        id: user.id,
        refreshTokenId,
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      },
    );

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.jwtConfiguration.secret,
      });

      const isValidRefreshToken = await this.redisService.validate(
        `user-${payload.id}`,
        payload.refreshTokenId,
      );
      if (!isValidRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userRepository.findOne({ where: { id: payload.id } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { accessToken } = await this.generateTokens(user);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
