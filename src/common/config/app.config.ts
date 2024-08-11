import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  return {
    nodeEnv: 'development',
    port: 8080,
  };
});
