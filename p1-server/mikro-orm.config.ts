import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import dotenv from 'dotenv'

dotenv.config();

const config: Options = {
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'], // path to your TS entities (src), relative to `baseDir`
  dbName: `${process.env.DB_NAME}`,
  user: `${process.env.USER}`,
  password: `${process.env.PASSWORD}`,
  driver: PostgreSqlDriver,
  // driverOptions: {
  //   connection: {
  //     ssl: true
  //   }
  // },
  host: `${process.env.DATABASE_URL}`

};

export default config;
