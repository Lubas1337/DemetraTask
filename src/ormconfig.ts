import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const ORMConfig: PostgresConnectionOptions  = {
  type: 'postgres',
  host: '127.0.0.1',
  port: 5497,
  username: 'postgres',
  password: 'postgres',
  database: 'nest',
  entities: [`${__dirname}/**/**/*.entity{.ts,.js}`],
  synchronize: true
};