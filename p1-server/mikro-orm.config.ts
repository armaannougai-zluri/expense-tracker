import { Options } from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql'
import dotenv from 'dotenv'

dotenv.config();

const config: Options = {
  entities: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  entitiesTs: ['./src/entities'], // path to your TS entities (src), relative to `baseDir`
  dbName: 'armaan-db',
  user: 'armaan-db_owner',
  password: '5CJYIkADSZP9',
  driver: PostgreSqlDriver,
  driverOptions :{connection: {ssl:true}},
  host: `${process.env.DATABASE_URL}`
    
};

export default config;
