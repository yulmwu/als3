import { refreshToken } from './auth'

export const getAccessToken = () => {
    return localStorage.getItem('accessToken') ?? ''
}

export const setAccessToken = (token: string) => {
    localStorage.setItem('accessToken', token)
}

export const clearAccessToken = () => {
    localStorage.removeItem('accessToken')
}

interface AuthHeader {
    headers: {
        Authorization: string
    }
}

export const withAuthRetry = async <T>(fn: (authHeader: AuthHeader, accessToken: string) => Promise<T>): Promise<T> => {
    try {
        const accessToken = getAccessToken()
        return await fn({ headers: { Authorization: `Bearer ${accessToken}` } }, accessToken)
    } catch (error: any) {
        if (error?.response?.status === 401 && getAccessToken()) {
            const newAccessToken = await refreshToken()
            setAccessToken(newAccessToken)
            return await fn({ headers: { Authorization: `Bearer ${newAccessToken}` } }, newAccessToken)
        }
        throw error
    }
}
