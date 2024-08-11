import { Processor, Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { User } from '../users/entities/user.entity';

@Injectable()
@Processor('user')
export class UserProcessor {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Process('updateUserStatus')
  async handleUpdateUserStatus(job: Job<{ userId: string }>): Promise<void> {
    const { userId } = job.data;
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (user) {
      user.status = true;
      await this.userRepository.save(user);
    }
  }
}
