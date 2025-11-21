import { Request } from 'express'

export interface AuthenticatedRequest extends Request {
    user: { userId: number }
    cookies: Record<string, string>
}

export interface MaybeAuthenticatedRequest extends Request {
    user?: { userId: number }
    cookies: Record<string, string>
}
