import { DataSource } from 'typeorm'
import { User } from './src/modules/users/users.entity'
import { File } from './src/modules/files/files.entity'

import * as dotenv from 'dotenv'
dotenv.config()

export default new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!, 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [User, File],
    migrations: ['src/migrations/*.ts'],
    synchronize: true,
})
