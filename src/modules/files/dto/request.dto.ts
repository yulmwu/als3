import { IntersectionType } from '@nestjs/swagger'
import { DirectoryNameDto, FilePathDto, PaginationDto } from './base.dto'

export class CreateDirectoryRequestDto extends IntersectionType(DirectoryNameDto, FilePathDto) {}

export class ListFilesRequestDto extends IntersectionType(FilePathDto, PaginationDto) {}
