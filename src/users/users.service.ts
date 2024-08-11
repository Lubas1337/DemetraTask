import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async getMe(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async getUserById(id: string): Promise<{ statusCode: number; message: string; user?: User }> {
    const cacheKey = `user-${id}`;

    const cachedUser = await this.redisService.get<User>(cacheKey);
    if (cachedUser) {
      return {
        statusCode: 200,
        message: 'SUCCESS',
        user: cachedUser,
      };
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.redisService.insert(cacheKey, user, 1800);

    return {
      statusCode: 200,
      message: 'SUCCESS',
      user,
    };
  }
}
