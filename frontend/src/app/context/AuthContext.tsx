'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getMe, loginUser, logout, registerUser, GetMeResponse } from '@/api/auth'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/api/token'

interface AuthContextProps {
    user: GetMeResponse | null
    loading: boolean
    login: (username: string, password: string) => Promise<void>
    register: (data: RegisterFormData) => Promise<void>
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
    const [loading, setLoading] = useState(true)

    const fetchMe = async () => {
        try {
            const me: GetMeResponse = await getMe()
            setUser(me)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (getAccessToken()) {
            fetchMe()
        } else {
            setLoading(false)
            setUser(null)
        }
    }, [])

    const login = async (username: string, password: string) => {
        setLoading(true)
        try {
            const result = await loginUser(username, password)
            setAccessToken(result.accessToken)
            await fetchMe()
        } catch (error: any) {
            console.error('Login failed:', error)
            const err = new Error(error?.response?.data?.message || error?.message || 'Login failed')
            ;(err as any).response = error?.response
            throw err
        } finally {
            setLoading(false)
        }
    }

    const register = async (data: RegisterFormData) => {
        setLoading(true)
        try {
            await registerUser(data.username, data.email, data.password, data.nickname)
        } catch (error: any) {
            console.error('Register failed:', error)
            const err = new Error(error?.response?.data?.message || error?.message || 'Registration failed')
            ;(err as any).response = error?.response
            throw err
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
        <AuthContext.Provider value={{ user, loading, login, register, logout: handleLogout, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
