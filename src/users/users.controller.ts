import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ActiveUser } from '../common/decorators/active-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { GetUserByIdDto } from './dto/get-user-by-id.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: "Get logged in user's details", type: User })
  @ApiBearerAuth()
  @Get('me')
  async getMe(@ActiveUser('id') userId: string): Promise<User> {
    return this.usersService.getMe(userId);
  }
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Get logged in user's details", type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('get-user-by-id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUserById(@Query() query: GetUserByIdDto): Promise<{ statusCode: number; message: string; user?: any }> {
    const { id } = query;
    return this.usersService.getUserById(id);
  }
}
