import { client } from './client'
import { withAuthRetry } from './token'

export enum UserRole {
    ADMIN = 0,
    USER = 1,
}

export interface UserResponse {
    id: number
    username: string
    nickname: string
    email: string
    description?: string
    profileImage?: string
    role: UserRole
    points: number
    postCount: number
    commentCount: number
    followersCount: number
    followingCount: number
    isFollowing?: boolean
    isFollowsMe?: boolean
    createdAt: string
}

export type UserBriefResponse = Pick<
    UserResponse,
    | 'id'
    | 'username'
    | 'nickname'
    | 'description'
    | 'profileImage'
    | 'role'
    | 'points'
    | 'followersCount'
    | 'followingCount'
    | 'isFollowing'
    | 'isFollowsMe'
>

const USERS_API_PREFIX = 'users'

export const getUserByUsername = async (username: string) => {
    return withAuthRetry(async (header) => {
        const response = await client.get<UserResponse>(`/${USERS_API_PREFIX}/${username}`, header)
        return response.data
    })
}

export type UserUpdateRequest = Partial<Pick<UserResponse, 'nickname' | 'description' | 'profileImage'>>

export const updateUser = async (username: string, payload: UserUpdateRequest) => {
    return withAuthRetry(async (header) => {
        const response = await client.put<UserResponse>(`/${USERS_API_PREFIX}/${username}`, payload, header)
        return response.data
    })
}
