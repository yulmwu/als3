import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JWT_EXPIRES_IN_SECONDS, REFRESH_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN_SECONDS } from 'common/constants'
import { JwtService, JwtSignOptions } from '@nestjs/jwt'
import { UsersService } from 'modules/users/users.service'
import { RedisService } from 'common/redis/redis.service'
import { User } from 'modules/users/users.entity'
import * as bcrypt from 'bcrypt'

import { GetMeResponseDto, LoginDto, RegisterDto } from './dto'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private redisService: RedisService,
    ) {}

    async login(dto: LoginDto) {
        const user = await this.usersService.getPasswordByUsername(dto.username)
        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const payload = { sub: user.id }
        const accessToken = this.jwtService.sign(payload, { expiresIn: JWT_EXPIRES_IN_SECONDS } as JwtSignOptions)
        const refreshToken = this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as JwtSignOptions)

        await this.redisService.set(`user:${user.id}:refresh`, refreshToken, REFRESH_TOKEN_EXPIRES_IN_SECONDS)

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user_id: user.id,
            max_age: JWT_EXPIRES_IN_SECONDS,
        }
    }

    async register(dto: RegisterDto): Promise<User> {
        return this.usersService.create(dto)
    }

    async refresh(userId: number, refreshToken: string) {
        const stored = await this.redisService.get(`user:${userId}:refresh`)
        if (!stored || stored !== refreshToken) {
            throw new UnauthorizedException('Invalid refresh token')
        }

        const payload = { sub: userId }
        const accessToken = this.jwtService.sign(payload)

        return { accessToken: accessToken }
    }

    async logout(userId: number) {
        await this.redisService.del(`user:${userId}:refresh`)
    }

    async getMe(userId: number): Promise<GetMeResponseDto> {
        const user = await this.usersService.findById(userId)
        return user
    }
}
