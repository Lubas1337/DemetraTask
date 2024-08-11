import { registerAs } from '@nestjs/config';

export default registerAs('bull', () => ({
  redis: {
    host: 'localhost',
    port: 6379,
  },
}));
