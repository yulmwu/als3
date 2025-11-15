export interface PaginationResponse {
    total: number
    page: number
    limit: number
}

export interface ApiError {
    status?: number
    message: string
    code?: string
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }
