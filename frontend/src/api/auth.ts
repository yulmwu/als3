import { client } from './client'
import { withAuthRetry } from './token'
import { UserResponse } from './users'

export interface RegisterResponse {
    id: number
    username: string
    nickname: string
    email: string
    createdAt: string
}

export interface LoginResponse {
    id: number
    accessToken: string
}

export interface RefreshResponse {
    accessToken: string
}

export interface LogoutResponse {}

export interface GetMeResponse extends UserResponse {}

const AUTH_API_PREFIX = 'auth'

export const registerUser = async (username: string, email: string, password: string, nickname?: string) => {
    const response = await client.post<RegisterResponse>(`/${AUTH_API_PREFIX}/register`, {
        username,
        email,
        password,
        nickname,
    })
    return response.data
}

export const loginUser = async (username: string, password: string) => {
    const response = await client.post<LoginResponse>(`/${AUTH_API_PREFIX}/login`, {
        username,
        password,
    })
    return response.data
}

export const refreshToken = async () => {
    const response = await client.post<RefreshResponse>(`/${AUTH_API_PREFIX}/refresh`)
    return response.data.accessToken
}

export const logout = async () => {
    await client.post<LogoutResponse>(`/${AUTH_API_PREFIX}/logout`)
}

export const getMe = async () => {
    return withAuthRetry(async (header) => {
        const response = await client.get<GetMeResponse>(`/${AUTH_API_PREFIX}/me`, header)
        return response.data
    })
}
