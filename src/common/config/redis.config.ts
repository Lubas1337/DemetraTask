import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: 'localhost',
  port: 6379,
  db: 1,
  keyPrefix: 'nest:',
  username: undefined,
  password: undefined,
}));
