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

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File) private fileRepo: Repository<File>,
        private storageService: StorageService,
    ) {}

    async uploadFile(file: Express.Multer.File, userId: number, parentUuid?: string): Promise<FileResponseDto> {
        if (!file) {
            throw new BadRequestException('No file provided')
        }

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
            if (!parent) {
                throw new NotFoundException('Parent directory not found')
            }
            parentId = parent.id
            parentPath = `${parent.path}${parent.name}/`.replace(/\/+/g, '/')
        }

        const existingItem = await this.fileRepo.findOne({
            where: {
                userId,
                name: file.originalname,
                parentId: parentId ?? IsNull(),
            },
        })

        if (existingItem) {
            throw new BadRequestException('A file with this name already exists in this directory')
        }

        let s3Key: string
        try {
            s3Key = await this.storageService.uploadFile(file, userId, parentPath)
        } catch (error) {
            throw new BadRequestException('Failed to upload file to storage')
        }

        try {
            const fileEntity = this.fileRepo.create({
                name: file.originalname,
                type: FileType.FILE,
                s3Key,
                mimeType: file.mimetype,
                size: file.size,
                path: parentPath,
                parentId,
                userId,
            })

            return await this.fileRepo.save(fileEntity)
        } catch (error) {
            await this.storageService.deleteFile(s3Key).catch(() => {})
            throw new BadRequestException('Failed to save file metadata')
        }
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

        return await this.fileRepo.save(directory)
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

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
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

        const downloadUrl = await this.storageService.getPresignedUrl(file.s3Key)

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
            const children = await this.fileRepo.find({
                where: {
                    userId,
                    parentId: file.id,
                },
            })

            for (const child of children) {
                await this.deleteFile(child.id, userId)
            }
        }

        if (file.type === FileType.FILE && file.s3Key) {
            try {
                await this.storageService.deleteFile(file.s3Key)
            } catch (error) {
                throw new BadRequestException('Failed to delete file from storage')
            }
        }

        await this.fileRepo.remove(file)
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

    async getBreadcrumb(uuid: string, userId: number): Promise<FileResponseDto[]> {
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

        return breadcrumb
    }
}
