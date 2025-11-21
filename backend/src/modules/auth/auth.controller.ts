import {
    Body,
    Controller,
    Post,
    BadRequestException,
    Res,
    Req,
    UnauthorizedException,
    UseGuards,
    Get,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger'
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS, JwtAuthGuard, AuthenticatedRequest } from '@als3/shared'
import { Request, Response } from 'express'
import { JwtService } from '@nestjs/jwt'

import { AccessTokenDto, GetMeResponseDto, LoginDto, LoginResponseDto, RegisterDto, RegisterResponseDto } from './dto'

@ApiTags('Authorization')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
    ) {}

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 201, description: 'Login successful.', type: LoginResponseDto })
    @ApiUnauthorizedResponse({ description: 'Invalid username or password.' })
    @ApiBadRequestResponse({ description: 'Request payload is invalid.' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
        const result = await this.authService.login(loginDto)

        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
        })

        return { id: result.user_id, accessToken: result.access_token, maxAgeSeconds: result.max_age }
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'User registration successful.', type: RegisterResponseDto })
    @ApiBadRequestResponse({ description: 'Username, password or email is invalid.' })
    @ApiConflictResponse({ description: 'Username or email already exists.' })
    register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
        return this.authService.register(registerDto)
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Re-issue access token using refresh token' })
    @ApiResponse({ status: 200, description: 'Returns new access token.', type: AccessTokenDto })
    @ApiBadRequestResponse({ description: 'Refresh token is required' })
    @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
    async refresh(@Req() req: Request): Promise<AccessTokenDto> {
        const userId = this.extractUserIdFromRefreshToken(req)
        const refreshToken = req.cookies?.refresh_token

        return this.authService.refresh(userId, refreshToken)
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout and remove refresh token' })
    @ApiResponse({ status: 200, description: 'Logout successful.' })
    @ApiBadRequestResponse({ description: 'Refresh token is required' })
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const userId = this.extractUserIdFromRefreshToken(req)
        await this.authService.logout(userId)

        res.clearCookie('refresh_token')
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Get current user information' })
    @ApiResponse({ status: 200, description: 'Returns current user information.', type: GetMeResponseDto })
    @ApiUnauthorizedResponse({ description: 'User is not authenticated.' })
    async getMe(@Req() req: AuthenticatedRequest): Promise<GetMeResponseDto> {
        if (!req.cookies?.refresh_token) {
            throw new BadRequestException('Refresh token is required')
        }

        return this.authService.getMe(req.user.userId)
    }

    private extractUserIdFromRefreshToken(req: Request): number {
        const refreshToken = req.cookies?.refresh_token
        if (!refreshToken) {
            throw new BadRequestException('Refresh token is required')
        }

        try {
            const payload = this.jwtService.decode(refreshToken) as { sub: number }
            if (typeof payload?.sub !== 'number') throw new Error()

            return payload.sub
        } catch {
            throw new UnauthorizedException('Invalid refresh token')
        }
    }
}
