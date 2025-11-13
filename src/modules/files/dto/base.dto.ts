import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { FileType } from '../files.entity'

export class FileNameDto {
    @ApiProperty({
        description: 'The name of the file or directory.',
        example: 'example.txt',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string
}

export class DirectoryNameDto {
    @ApiProperty({
        description: 'The name of the directory (cannot contain slashes or special characters).',
        example: 'my-folder',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string
}

export class FilePathDto {
    @ApiProperty({
        description: 'The path of the file or directory.',
        example: '/documents/',
        default: '/',
    })
    @IsString()
    @IsOptional()
    @MaxLength(2048)
    path?: string
}

export class FileTypeDto {
    @ApiProperty({
        description: 'The type of the item (file or directory).',
        enum: FileType,
        example: FileType.FILE,
    })
    @IsEnum(FileType)
    @IsNotEmpty()
    type: FileType
}

export class PaginationDto {
    @ApiProperty({
        description: 'Page number for pagination.',
        example: 1,
        default: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number

    @ApiProperty({
        description: 'Number of items per page.',
        example: 20,
        default: 20,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number
}
