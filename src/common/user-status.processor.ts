import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserStatusProcessor implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectQueue('user-status') private readonly userStatusQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.userStatusQueue.process(async (job) => {
      const { userId } = job.data;
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.status = true;
        await this.userRepository.save(user);
      }
    });
  }
}
