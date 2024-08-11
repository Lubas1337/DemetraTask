import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { IORedisKey } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(
    @Inject(IORedisKey)
    private readonly redisClient: Redis,
  ) {}

  async getKeys(pattern?: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  async insert<T>(key: string, value: T, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    await this.redisClient.set(key, stringValue);
    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async validate(key: string, value: any): Promise<boolean> {
    const storedValue = await this.get<any>(key);
    return storedValue === value;
  }
}
