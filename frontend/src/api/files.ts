import { client } from './client'
import { withAuthRetry } from './token'

export interface FileItem {
    id: number
    uuid: string
    name: string
    type: 'file' | 'directory'
    s3Key?: string
    mimeType?: string
    size?: number
    path: string
    parentId?: number
    userId: number
    createdAt: string
    updatedAt: string
}

export interface FileWithDownloadUrl extends FileItem {
    downloadUrl?: string
}

export interface ListFilesResponse {
    items: FileItem[]
    total: number
    page: number
    limit: number
    totalPages: number
    breadcrumb: FileItem[]
}

export interface CreateDirectoryRequest {
    name: string
    parentUuid?: string
}

const FILES_API_PREFIX = 'files'

export const uploadFile = async (file: File, parentUuid?: string) => {
    return withAuthRetry(async (header) => {
        const formData = new FormData()
        formData.append('file', file)
        if (parentUuid) {
            formData.append('parentUuid', parentUuid)
        }

        const response = await client.post<FileItem>(`/${FILES_API_PREFIX}/upload`, formData, {
            ...header,
            headers: {
                ...header.headers,
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    })
}

export const createDirectory = async (data: CreateDirectoryRequest) => {
    return withAuthRetry(async (header) => {
        const response = await client.post<FileItem>(`/${FILES_API_PREFIX}/directory`, data, header)
        return response.data
    })
}

export const listFiles = async (parentUuid?: string, page: number = 1, limit: number = 20) => {
    return withAuthRetry(async (header) => {
        const response = await client.get<ListFilesResponse>(`/${FILES_API_PREFIX}`, {
            ...header,
            params: { parentUuid, page, limit },
        })
        return response.data
    })
}

export const getFile = async (id: number) => {
    return withAuthRetry(async (header) => {
        const response = await client.get<FileItem>(`/${FILES_API_PREFIX}/${id}`, header)
        return response.data
    })
}

export const getFileByUuid = async (uuid: string) => {
    return withAuthRetry(async (header) => {
        const response = await client.get<FileItem>(`/${FILES_API_PREFIX}/uuid/${uuid}`, header)
        return response.data
    })
}

export const getDownloadUrl = async (id: number) => {
    return withAuthRetry(async (header) => {
        const response = await client.get<FileWithDownloadUrl>(`/${FILES_API_PREFIX}/${id}/download`, header)
        return response.data
    })
}

export const getDownloadUrlByUuid = async (uuid: string) => {
    return withAuthRetry(async (header) => {
        const response = await client.get<FileWithDownloadUrl>(`/${FILES_API_PREFIX}/uuid/${uuid}/download`, header)
        return response.data
    })
}

export const renameFile = async (id: number, newName: string) => {
    return withAuthRetry(async (header) => {
        const response = await client.patch<FileItem>(`/${FILES_API_PREFIX}/${id}/rename`, { newName }, header)
        return response.data
    })
}

export const moveFile = async (id: number, targetParentUuid?: string) => {
    return withAuthRetry(async (header) => {
        const response = await client.patch<FileItem>(`/${FILES_API_PREFIX}/${id}/move`, { targetParentUuid }, header)
        return response.data
    })
}

export const deleteFile = async (id: number) => {
    return withAuthRetry(async (header) => {
        const response = await client.delete<{ message: string }>(`/${FILES_API_PREFIX}/${id}`, header)
        return response.data
    })
}
