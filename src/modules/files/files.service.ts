import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
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

    async uploadFile(file: Express.Multer.File, userId: number, path: string = '/'): Promise<FileResponseDto> {
        if (!file) {
            throw new BadRequestException('No file provided')
        }

        if (!file.originalname || file.originalname.trim() === '') {
            throw new BadRequestException('Invalid file name')
        }

        this.validateFileName(file.originalname)

        const normalizedPath = this.normalizePath(path)

        if (normalizedPath !== '/') {
            await this.validatePath(normalizedPath, userId)
        }

        const existingItem = await this.fileRepo.findOne({
            where: {
                userId,
                name: file.originalname,
                path: normalizedPath,
            },
        })

        if (existingItem) {
            if (existingItem.type === FileType.FILE) {
                throw new BadRequestException('A file with this name already exists in this directory')
            } else {
                throw new BadRequestException('A directory with this name already exists in this directory')
            }
        }

        let s3Key: string
        try {
            s3Key = await this.storageService.uploadFile(file, userId, normalizedPath)
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
                path: normalizedPath,
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

        const parentPath = this.normalizePath(dto.path || '/')

        if (parentPath !== '/') {
            await this.validatePath(parentPath, userId)
        }

        const existingItem = await this.fileRepo.findOne({
            where: {
                userId,
                name: dto.name,
                path: parentPath,
            },
        })

        if (existingItem) {
            if (existingItem.type === FileType.DIRECTORY) {
                throw new BadRequestException('A directory with this name already exists at this path')
            } else {
                throw new BadRequestException('A file with this name already exists at this path')
            }
        }

        const directory = this.fileRepo.create({
            name: dto.name,
            type: FileType.DIRECTORY,
            path: parentPath,
            userId,
        })

        return await this.fileRepo.save(directory)
    }

    async listFiles(dto: ListFilesRequestDto, userId: number): Promise<ListFilesResponseDto> {
        const path = this.normalizePath(dto.path || '/')
        const page = dto.page || 1
        const limit = dto.limit || 20
        const skip = (page - 1) * limit

        if (path !== '/') {
            await this.validatePath(path, userId)
        }

        const [items, total] = await this.fileRepo.findAndCount({
            where: {
                userId,
                path,
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
            const childPath = `${file.path}${file.name}/`.replace(/\/+/g, '/')
            const children = await this.fileRepo.find({
                where: {
                    userId,
                    path: childPath,
                },
            })

            if (children.length > 0) {
                throw new BadRequestException('Cannot delete a non-empty directory')
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

    private normalizePath(path: string): string {
        if (!path || path === '') {
            return '/'
        }

        let normalized = path.trim()

        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized
        }

        if (!normalized.endsWith('/')) {
            normalized = normalized + '/'
        }

        normalized = normalized.replace(/\/+/g, '/')

        if (normalized.includes('..')) {
            throw new BadRequestException('Path cannot contain ".."')
        }

        if (normalized.length > 2048) {
            throw new BadRequestException('Path is too long (max 2048 characters)')
        }

        return normalized
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

    private async validatePath(path: string, userId: number): Promise<void> {
        if (path === '/') {
            return
        }

        const parts = path.split('/').filter((p) => p !== '')

        let currentPath = '/'
        for (const part of parts) {
            const directory = await this.fileRepo.findOne({
                where: {
                    userId,
                    name: part,
                    path: currentPath,
                    type: FileType.DIRECTORY,
                },
            })

            if (!directory) {
                throw new NotFoundException(`Directory not found: ${currentPath}${part}`)
            }

            currentPath = `${currentPath}${part}/`.replace(/\/+/g, '/')
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
}
