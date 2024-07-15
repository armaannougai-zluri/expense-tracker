import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';
import { Users } from './entities/User'
import { v4 as uuid } from 'uuid'

async function main() {
    const orm = await MikroORM.init(config);
    const em = orm.em.fork(); // Fork the EntityManager

    // Example: Create a new user
    const condition = { name: "postman" }
    await em.transactional(async em => {
        const listOfUsers = await em.findAll(Users, { where: condition });
        for (const user of listOfUsers) {
            console.log("user removed: ", user);
            em.remove(user);
        }
    }
    )


}

main().catch(console.error);
