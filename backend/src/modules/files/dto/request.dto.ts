import { ApiProperty, IntersectionType } from '@nestjs/swagger'
import { IsOptional, IsUUID } from 'class-validator'
import { DirectoryNameDto, PaginationDto } from './base.dto'

export class CreateDirectoryRequestDto extends DirectoryNameDto {
    @ApiProperty({
        description: 'The UUID of the parent directory (null for root).',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    parentUuid?: string
}

export class ListFilesRequestDto extends PaginationDto {
    @ApiProperty({
        description: 'The UUID of the directory to list (null for root).',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    parentUuid?: string
}
