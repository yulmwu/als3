import { ApiProperty, IntersectionType } from '@nestjs/swagger'
import { IdDto, CreatedAtDto } from '@als3/shared'
import { FileNameDto, FilePathDto, FileTypeDto } from './base.dto'
import { FileType } from '../files.entity'

export class FileBaseResponseDto extends IntersectionType(IdDto, FileNameDto, FilePathDto, FileTypeDto, CreatedAtDto) {
    @ApiProperty({
        description: 'The UUID of the file or directory.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    uuid: string

    @ApiProperty({
        description: 'The S3 key of the file (null for directories).',
        example: 'users/1/abc123.txt',
        nullable: true,
    })
    s3Key?: string

    @ApiProperty({
        description: 'The MIME type of the file.',
        example: 'text/plain',
        nullable: true,
    })
    mimeType?: string

    @ApiProperty({
        description: 'The size of the file in bytes.',
        example: 1024,
        nullable: true,
    })
    size?: number

    @ApiProperty({
        description: 'The ID of the user who owns this file.',
        example: 1,
    })
    userId: number

    @ApiProperty({
        description: 'The parent directory ID (null for root items).',
        example: 1,
        nullable: true,
    })
    parentId?: number | null

    @ApiProperty({
        description: 'The last update timestamp.',
        example: '2023-10-01T12:00:00Z',
    })
    updatedAt: Date
}

export class FileResponseDto extends FileBaseResponseDto {}

export class FileWithDownloadUrlResponseDto extends FileBaseResponseDto {
    @ApiProperty({
        description: 'The presigned URL for downloading the file.',
        example: 'https://s3.amazonaws.com/bucket/file?signature=...',
        nullable: true,
    })
    downloadUrl?: string
}

export class ListFilesResponseDto {
    @ApiProperty({
        description: 'The list of files and directories.',
        type: [FileResponseDto],
    })
    items: FileResponseDto[]

    @ApiProperty({
        description: 'Total number of items.',
        example: 100,
    })
    total: number

    @ApiProperty({
        description: 'Current page number.',
        example: 1,
    })
    page: number

    @ApiProperty({
        description: 'Number of items per page.',
        example: 20,
    })
    limit: number

    @ApiProperty({
        description: 'Total number of pages.',
        example: 5,
    })
    totalPages: number

    @ApiProperty({
        description: 'Breadcrumb path from root to current directory.',
        type: [FileResponseDto],
    })
    breadcrumb: FileResponseDto[]
}
