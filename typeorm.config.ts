import { DataSource } from 'typeorm'
import { User } from './src/modules/users/users.entity'

import * as dotenv from 'dotenv'
dotenv.config()

export default new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!, 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [User],
    migrations: ['src/migrations/*.ts'],
    synchronize: true,
})
