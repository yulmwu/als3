'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getMe, loginUser, logout, registerUser, GetMeResponse } from '@/api/auth'
import type { ApiResult } from '@/api/types'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/api/token'

interface AuthContextProps {
    user: GetMeResponse | null
    initializing: boolean
    loading: boolean
    login: (username: string, password: string) => Promise<ApiResult<void>>
    register: (data: RegisterFormData) => Promise<ApiResult<void>>
    logout: () => Promise<void>
    setUser: React.Dispatch<React.SetStateAction<GetMeResponse | null>>
}

export interface RegisterFormData {
    username: string
    nickname: string
    email: string
    password: string
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<GetMeResponse | null>(null)
    const [initializing, setInitializing] = useState(true)
    const [loading, setLoading] = useState(false)

    const fetchMe = async () => {
        try {
            const me: GetMeResponse = await getMe()
            setUser(me)
        } catch {
            setUser(null)
        } finally {
            setInitializing(false)
        }
    }

    useEffect(() => {
        if (getAccessToken()) {
            fetchMe()
        } else {
            setInitializing(false)
            setUser(null)
        }
    }, [])

    const login = async (username: string, password: string): Promise<ApiResult<void>> => {
        setLoading(true)
        try {
            const result = await loginUser(username, password)
            if (!result.ok) {
                console.warn('Login failed:', result.error)
                return { ok: false, error: result.error }
            }
            setAccessToken(result.data.accessToken)
            await fetchMe()
            return { ok: true, data: undefined }
        } finally {
            setLoading(false)
        }
    }

    const register = async (data: RegisterFormData): Promise<ApiResult<void>> => {
        setLoading(true)
        try {
            const result = await registerUser(data.username, data.email, data.password, data.nickname)
            if (!result.ok) {
                console.warn('Register failed:', result.error)
                return { ok: false, error: result.error }
            }
            return { ok: true, data: undefined }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            setUser(null)
            clearAccessToken()
            await logout()
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, initializing, loading, login, register, logout: handleLogout, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
