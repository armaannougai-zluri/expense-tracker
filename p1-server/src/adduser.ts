import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';
import {Users} from './entities/User'
import {v4 as uuid} from 'uuid'

async function main() {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork(); // Fork the EntityManager

  // Example: Create a new user
  const user = new Users();
  user.id = uuid();
  user.name = "kareena";

  await em.persistAndFlush(user);

  console.log('User created:', user);
}

main().catch(console.error);
