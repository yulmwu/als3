import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'
import { ConfigModule, ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService) => {
                return new Redis({
                    port: Number(configService.get<string>('REDIS_PORT') ?? 6379),
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    password: configService.get<string>('REDIS_PASSWORD') ?? void 0,
                    db: Number(configService.get<string>('REDIS_DB') ?? 0),
                })
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    exports: [RedisService],
})
export class RedisModule {}
