import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: 'asf78jhkasd8982kjds',
    accessTokenTtl: 38000,
  };
});
