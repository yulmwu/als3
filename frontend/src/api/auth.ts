import axios from 'axios'
import { client } from './client'
import { withAuthRetry } from './token'
import { UserResponse } from './users'
import type { ApiResult } from './types'

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
    try {
        const response = await client.post<RegisterResponse>(`/${AUTH_API_PREFIX}/register`, {
            username,
            email,
            password,
            nickname,
        })
        const data: ApiResult<RegisterResponse> = { ok: true, data: response.data }
        return data
    } catch (err: any) {
        const status = err?.response?.status as number | undefined
        const message =
            err?.response?.data?.message ||
            err?.message ||
            (status === 409 ? '이미 존재하는 사용자입니다.' : '회원가입에 실패했습니다.')
        const data: ApiResult<RegisterResponse> = { ok: false, error: { status, message } }
        return data
    }
}

export const loginUser = async (username: string, password: string) => {
    try {
        const response = await client.post<LoginResponse>(`/${AUTH_API_PREFIX}/login`, {
            username,
            password,
        })
        const data: ApiResult<LoginResponse> = { ok: true, data: response.data }
        return data
    } catch (err: any) {
        const isAxios = axios.isAxiosError(err)
        const status = isAxios ? err.response?.status : undefined
        const message =
            (isAxios && (err.response?.data as any)?.message) ||
            (status === 401
                ? '아이디 또는 비밀번호가 올바르지 않습니다.'
                : status === 404
                  ? '유저를 찾을 수 없습니다.'
                  : undefined) ||
            err?.message ||
            '로그인에 실패했습니다.'
        const data: ApiResult<LoginResponse> = { ok: false, error: { status, message } }
        return data
    }
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
