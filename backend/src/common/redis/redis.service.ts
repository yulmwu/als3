import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

    onModuleDestroy() {
        if (this.client) {
            this.client.quit()
        }
    }

    async set(key: string, value: string, expireSeconds?: number) {
        if (expireSeconds) {
            await this.client.set(key, value, 'EX', expireSeconds)
        } else {
            await this.client.set(key, value)
        }
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key)
    }

    async del(key: string) {
        await this.client.del(key)
    }

    async delPattern(pattern: string) {
        const keys = await this.client.keys(pattern)
        if (keys.length > 0) {
            await this.client.del(...keys)
        }
    }
}
