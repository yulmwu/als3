import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { File, FileType } from './files.entity'
import { StorageService } from 'common/storage/storage.service'
import {
    FileResponseDto,
    FileWithDownloadUrlResponseDto,
    ListFilesResponseDto,
    CreateDirectoryRequestDto,
    ListFilesRequestDto,
} from './dto'
import { RedisService } from 'common/redis/redis.service'

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File) private fileRepo: Repository<File>,
        private storageService: StorageService,
        private redisService: RedisService,
    ) {}

    async uploadFile(file: Express.Multer.File, userId: number, parentUuid?: string): Promise<FileResponseDto> {
        if (!file) throw new BadRequestException('No file provided')
        if (!file.originalname || file.originalname.trim() === '') {
            throw new BadRequestException('Invalid file name')
        }

        this.validateFileName(file.originalname)

        let parentId: number | undefined = undefined
        let parentPath = '/'
        if (parentUuid) {
            const parent = await this.fileRepo.findOne({
                where: { uuid: parentUuid, userId, type: FileType.DIRECTORY },
            })
            if (!parent) throw new NotFoundException('Parent directory not found')
            parentId = parent.id
            parentPath = `${parent.path}${parent.name}/`.replace(/\/+/g, '/')
        }

        const existingItem = await this.fileRepo.findOne({
            where: { userId, name: file.originalname, parentId: parentId ?? IsNull() },
        })

        if (existingItem) {
            throw new BadRequestException('A file with this name already exists in this location')
        }

        const initialEntity = this.fileRepo.create({
            name: file.originalname,
            type: FileType.FILE,
            mimeType: file.mimetype,
            size: file.size,
            path: parentPath,
            parentId,
            userId,
        })

        const saved = await this.fileRepo.save(initialEntity)
        const s3Key = `users/${userId}/f/${saved.uuid}`

        try {
            await this.storageService.uploadFileWithKey(file, s3Key)
        } catch (err) {
            await this.fileRepo.delete({ id: saved.id })
            throw new BadRequestException('Failed to upload file to storage')
        }

        saved.s3Key = s3Key
        const updated = await this.fileRepo.save(saved)
        await this.redisService.delPattern(`list:${userId}:*`)
        return updated
    }

    async createDirectory(dto: CreateDirectoryRequestDto, userId: number): Promise<FileResponseDto> {
        this.validateDirectoryName(dto.name)

        let parentId: number | undefined = undefined
        let parentPath = '/'

        if (dto.parentUuid) {
            const parent = await this.fileRepo.findOne({
                where: { uuid: dto.parentUuid, userId, type: FileType.DIRECTORY },
            })
            if (!parent) {
                throw new NotFoundException('Parent directory not found')
            }
            parentId = parent.id
            parentPath = `${parent.path}${parent.name}/`.replace(/\/+/g, '/')
        }

        const existingItem = await this.fileRepo.findOne({
            where: {
                userId,
                name: dto.name,
                parentId: parentId ?? IsNull(),
            },
        })

        if (existingItem) {
            throw new BadRequestException('A directory with this name already exists in this location')
        }

        const directory = this.fileRepo.create({
            name: dto.name,
            type: FileType.DIRECTORY,
            path: parentPath,
            parentId,
            userId,
        })

        const savedDir = await this.fileRepo.save(directory)
        await this.redisService.delPattern(`list:${userId}:*`)
        return savedDir
    }

    async listFiles(dto: ListFilesRequestDto, userId: number): Promise<ListFilesResponseDto> {
        const page = dto.page || 1
        const limit = dto.limit || 20
        const skip = (page - 1) * limit

        let parentId: number | undefined = undefined

        if (dto.parentUuid) {
            const parent = await this.fileRepo.findOne({
                where: { uuid: dto.parentUuid, userId, type: FileType.DIRECTORY },
            })
            if (!parent) {
                throw new NotFoundException('Parent directory not found')
            }
            parentId = parent.id
        }

        const parentKey = dto.parentUuid || 'root'
        const cacheKey = `list:${userId}:${parentKey}:${page}:${limit}`
        const cached = await this.redisService.get(cacheKey)
        if (cached) {
            return JSON.parse(cached)
        }

        const [items, total] = await this.fileRepo.findAndCount({
            where: {
                userId,
                parentId: parentId ?? IsNull(),
            },
            order: {
                type: 'DESC',
                name: 'ASC',
            },
            skip,
            take: limit,
        })

        const response = {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            breadcrumb: await this.getBreadcrumb(userId, dto.parentUuid),
        }

        await this.redisService.set(cacheKey, JSON.stringify(response), 30)

        return response
    }

    async getDownloadUrl(fileId: number, userId: number): Promise<FileWithDownloadUrlResponseDto> {
        const file = await this.fileRepo.findOne({
            where: { id: fileId },
        })

        if (!file) {
            throw new NotFoundException('File not found')
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('You do not have permission to access this file')
        }

        if (file.type !== FileType.FILE) {
            throw new BadRequestException('Cannot download a directory')
        }

        if (!file.s3Key) {
            throw new BadRequestException('File has no S3 key')
        }

        const downloadUrl = await this.storageService.getPresignedUrl(
            file.s3Key,
            3600,
            file.name,
            file.mimeType || 'application/octet-stream',
        )

        return {
            ...file,
            downloadUrl,
        }
    }

    async deleteFile(fileId: number, userId: number): Promise<void> {
        const file = await this.fileRepo.findOne({
            where: { id: fileId },
        })

        if (!file) {
            throw new NotFoundException('File not found')
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('You do not have permission to delete this file')
        }

        if (file.type === FileType.DIRECTORY) {
            const descendants: { s3Key: string | null }[] = await this.fileRepo.query(
                `
                WITH RECURSIVE descendants AS (
                    SELECT id, "parentId", type, "s3Key", "userId"
                    FROM files
                    WHERE id = $1 AND "userId" = $2

                    UNION ALL

                    SELECT f.id, f."parentId", f.type, f."s3Key", f."userId"
                    FROM files f
                    INNER JOIN descendants d ON f."parentId" = d.id
                    WHERE f."userId" = $2
                )
                SELECT "s3Key" FROM descendants WHERE type = 'file' AND "s3Key" IS NOT NULL
                `,
                [file.id, userId],
            )

            const keys = descendants.map((r) => r.s3Key!).filter(Boolean)
            if (keys.length) {
                try {
                    await this.storageService.deleteFiles(keys)
                } catch {
                    throw new BadRequestException('Failed to delete files from storage')
                }
            }

            await this.fileRepo.delete({ id: file.id })
        } else {
            if (file.s3Key) {
                try {
                    await this.storageService.deleteFile(file.s3Key)
                } catch (error) {
                    throw new BadRequestException('Failed to delete file from storage')
                }
            }
            await this.fileRepo.delete({ id: file.id })
        }

        await this.redisService.delPattern(`breadcrumb:${userId}:*`)
        await this.redisService.delPattern(`list:${userId}:*`)
    }

    async renameFile(fileId: number, newName: string, userId: number): Promise<FileResponseDto> {
        const file = await this.fileRepo.findOne({
            where: { id: fileId },
        })

        if (!file) {
            throw new NotFoundException('File not found')
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('You do not have permission to rename this file')
        }

        if (file.name === newName) {
            return file
        }

        if (file.type === FileType.DIRECTORY) {
            this.validateDirectoryName(newName)
        } else {
            this.validateFileName(newName)
        }

        const existingItem = await this.fileRepo.findOne({
            where: {
                userId,
                name: newName,
                parentId: file.parentId ?? IsNull(),
            },
        })

        if (existingItem && existingItem.id !== fileId) {
            throw new BadRequestException('A file or directory with this name already exists in this location')
        }

        file.name = newName
        const updated = await this.fileRepo.save(file)

        await this.redisService.delPattern(`breadcrumb:${userId}:*`)
        await this.redisService.delPattern(`list:${userId}:*`)

        return updated
    }

    private validateDirectoryName(name: string): void {
        if (!name || name.trim() === '') {
            throw new BadRequestException('Directory name cannot be empty')
        }

        if (name.includes('/')) {
            throw new BadRequestException('Directory name cannot contain slashes')
        }

        const invalidChars = /[<>:"|?*\x00-\x1f]/
        if (invalidChars.test(name)) {
            throw new BadRequestException('Directory name contains invalid characters')
        }

        if (name === '.' || name === '..') {
            throw new BadRequestException('Directory name cannot be "." or ".."')
        }

        if (name.startsWith(' ') || name.endsWith(' ') || name.startsWith('.') || name.endsWith('.')) {
            throw new BadRequestException('Directory name cannot start or end with spaces or dots')
        }

        if (name.length > 255) {
            throw new BadRequestException('Directory name is too long (max 255 characters)')
        }
    }

    private validateFileName(name: string): void {
        if (!name || name.trim() === '') {
            throw new BadRequestException('File name cannot be empty')
        }

        if (name.includes('/') || name.includes('\\')) {
            throw new BadRequestException('File name cannot contain slashes or backslashes')
        }

        const invalidChars = /[<>:"|?*\x00-\x1f]/
        if (invalidChars.test(name)) {
            throw new BadRequestException('File name contains invalid characters')
        }

        if (name === '.' || name === '..') {
            throw new BadRequestException('File name cannot be "." or ".."')
        }

        const trimmedName = name.trim()
        if (trimmedName.startsWith('.') && trimmedName.length > 1 && trimmedName.charAt(1) === '.') {
            throw new BadRequestException('File name cannot start with ".."')
        }

        if (name.length > 255) {
            throw new BadRequestException('File name is too long (max 255 characters)')
        }
    }

    async getFile(fileId: number, userId: number): Promise<FileResponseDto> {
        const file = await this.fileRepo.findOne({
            where: { id: fileId },
        })

        if (!file) {
            throw new NotFoundException('File not found')
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('You do not have permission to access this file')
        }

        return file
    }

    async getFileByUuid(uuid: string, userId: number): Promise<FileResponseDto> {
        const file = await this.fileRepo.findOne({
            where: { uuid, userId },
        })

        if (!file) {
            throw new NotFoundException('File not found')
        }

        return file
    }

    async getBreadcrumb(userId: number, uuid?: string): Promise<FileResponseDto[]> {
        if (!uuid) {
            return []
        }

        const cacheKey = `breadcrumb:${userId}:${uuid}`
        const cached = await this.redisService.get(cacheKey)

        if (cached) {
            return JSON.parse(cached)
        }

        const file = await this.getFileByUuid(uuid, userId)

        if (file.type !== FileType.DIRECTORY) {
            throw new BadRequestException('Breadcrumb is only available for directories')
        }

        const breadcrumb = await this.fileRepo.query(
            `
            WITH RECURSIVE parent_chain AS (
                SELECT id, uuid, name, type, "s3Key", "mimeType", size, path, "parentId", "userId", "createdAt", "updatedAt"
                FROM files
                WHERE id = $1 AND "userId" = $2
                
                UNION ALL

                SELECT f.id, f.uuid, f.name, f.type, f."s3Key", f."mimeType", f.size, f.path, f."parentId", f."userId", f."createdAt", f."updatedAt"
                FROM files f
                INNER JOIN parent_chain pc ON f.id = pc."parentId"
                WHERE f."userId" = $2
            )
            SELECT * FROM parent_chain
            ORDER BY path, name
            `,
            [file.id, userId],
        )

        await this.redisService.set(cacheKey, JSON.stringify(breadcrumb), 3600)

        return breadcrumb
    }

    async moveFile(fileId: number, userId: number, targetParentUuid?: string): Promise<FileResponseDto> {
        const file = await this.fileRepo.findOne({
            where: { id: fileId },
        })

        if (!file) {
            throw new NotFoundException('File not found')
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('You do not have permission to move this file')
        }

        let targetParentId: number | null = null
        let targetParentPath = '/'

        if (targetParentUuid) {
            const targetParent = await this.fileRepo.findOne({
                where: { uuid: targetParentUuid, userId, type: FileType.DIRECTORY },
            })

            if (!targetParent) {
                throw new NotFoundException('Target parent directory not found')
            }

            if (file.type === FileType.DIRECTORY) {
                const isDescendant = await this.isDescendant(file.id, targetParent.id, userId)
                if (isDescendant || file.id === targetParent.id) {
                    throw new BadRequestException('Cannot move a directory into itself or its descendant')
                }
            }

            targetParentId = targetParent.id
            targetParentPath = `${targetParent.path}${targetParent.name}/`.replace(/\/+/g, '/')
        }

        const currentParentId = file.parentId ?? null
        if (currentParentId === targetParentId) {
            throw new BadRequestException('File is already in the target location')
        }

        const existingItem = await this.fileRepo.findOne({
            where: {
                userId,
                name: file.name,
                parentId: targetParentId === null ? IsNull() : targetParentId,
            },
        })

        if (existingItem && existingItem.id !== file.id) {
            throw new BadRequestException('A file with this name already exists in the target location')
        }

        file.parentId = targetParentId
        file.path = targetParentPath

        const updatedFile = await this.fileRepo.save(file)

        await this.redisService.delPattern(`list:${userId}:*`)
        await this.redisService.delPattern(`breadcrumb:${userId}:*`)

        return updatedFile
    }

    private async isDescendant(ancestorId: number, descendantId: number, userId: number): Promise<boolean> {
        const result: { exists: boolean }[] = await this.fileRepo.query(
            `
            WITH RECURSIVE descendants AS (
                SELECT id, "parentId"
                FROM files
                WHERE id = $1 AND "userId" = $3

                UNION ALL

                SELECT f.id, f."parentId"
                FROM files f
                INNER JOIN descendants d ON f."parentId" = d.id
                WHERE f."userId" = $3
            )
            SELECT EXISTS(SELECT 1 FROM descendants WHERE id = $2) as exists
            `,
            [ancestorId, descendantId, userId],
        )

        return result[0]?.exists || false
    }
}
