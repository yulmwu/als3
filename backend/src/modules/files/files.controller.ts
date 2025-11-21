import {
    Controller,
    Post,
    Get,
    Delete,
    Patch,
    Query,
    Param,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    Res,
    StreamableFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiNotFoundResponse,
    ApiForbiddenResponse,
    ApiBadRequestResponse,
    ApiProperty,
} from '@nestjs/swagger'
import { IsUUID } from 'class-validator'
import { Response } from 'express'
import { JwtAuthGuard, AuthenticatedRequest, IdDto } from '@als3/shared'
import { FilesService } from './files.service'
import {
    FileResponseDto,
    FileWithDownloadUrlResponseDto,
    ListFilesResponseDto,
    CreateDirectoryRequestDto,
    ListFilesRequestDto,
    RenameFileRequestDto,
    MoveFileRequestDto,
} from './dto'

class UuidDto {
    @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
    @IsUUID()
    uuid: string
}

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
    constructor(private filesService: FilesService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload a file to a specific directory' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'The file to upload',
                },
                parentUuid: {
                    type: 'string',
                    format: 'uuid',
                    description: 'The parent directory UUID (omit for root)',
                    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully.', type: FileResponseDto })
    @ApiBadRequestResponse({
        description: 'Invalid file, parent does not exist, or file with same name already exists.',
    })
    @ApiNotFoundResponse({ description: 'The specified parent directory does not exist.' })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('parentUuid') parentUuid: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<FileResponseDto> {
        return this.filesService.uploadFile(file, req.user.userId, parentUuid)
    }

    @Post('directory')
    @ApiOperation({ summary: 'Create a new directory' })
    @ApiBody({
        type: CreateDirectoryRequestDto,
        examples: {
            root: {
                summary: 'Create directory in root',
                value: {
                    name: 'my-folder',
                },
            },
            nested: {
                summary: 'Create nested directory',
                value: {
                    name: 'subfolder',
                    parentUuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Directory created successfully.', type: FileResponseDto })
    @ApiBadRequestResponse({
        description:
            'Invalid directory name (contains special characters, slashes, or is empty), parent does not exist, or directory with same name already exists.',
    })
    @ApiNotFoundResponse({ description: 'The parent directory does not exist.' })
    createDirectory(
        @Body() dto: CreateDirectoryRequestDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<FileResponseDto> {
        return this.filesService.createDirectory(dto, req.user.userId)
    }

    @Get()
    @ApiOperation({ summary: 'List files and directories' })
    @ApiResponse({ status: 200, description: 'Return list of files and directories.', type: ListFilesResponseDto })
    listFiles(@Query() dto: ListFilesRequestDto, @Request() req: AuthenticatedRequest): Promise<ListFilesResponseDto> {
        return this.filesService.listFiles(dto, req.user.userId)
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get file information by ID' })
    @ApiResponse({ status: 200, description: 'Return file information.', type: FileResponseDto })
    @ApiNotFoundResponse({ description: 'File not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to access this file.' })
    getFile(@Param() { id }: IdDto, @Request() req: AuthenticatedRequest): Promise<FileResponseDto> {
        return this.filesService.getFile(id, req.user.userId)
    }

    @Get('uuid/:uuid')
    @ApiOperation({ summary: 'Get file information by UUID' })
    @ApiResponse({ status: 200, description: 'Return file information.', type: FileResponseDto })
    @ApiNotFoundResponse({ description: 'File not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to access this file.' })
    getFileByUuid(@Param() { uuid }: UuidDto, @Request() req: AuthenticatedRequest): Promise<FileResponseDto> {
        return this.filesService.getFileByUuid(uuid, req.user.userId)
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Get download URL for a file' })
    @ApiResponse({
        status: 200,
        description: 'Return file information with presigned download URL.',
        type: FileWithDownloadUrlResponseDto,
    })
    @ApiNotFoundResponse({ description: 'File not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to access this file.' })
    @ApiBadRequestResponse({ description: 'Cannot download a directory.' })
    getDownloadUrl(
        @Param() { id }: IdDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<FileWithDownloadUrlResponseDto> {
        return this.filesService.getDownloadUrl(id, req.user.userId)
    }

    @Get('uuid/:uuid/download')
    @ApiOperation({ summary: 'Get download URL for a file by UUID' })
    @ApiResponse({
        status: 200,
        description: 'Return file information with presigned download URL.',
        type: FileWithDownloadUrlResponseDto,
    })
    @ApiNotFoundResponse({ description: 'File not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to access this file.' })
    @ApiBadRequestResponse({ description: 'Cannot download a directory.' })
    async getDownloadUrlByUuid(
        @Param() { uuid }: UuidDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<FileWithDownloadUrlResponseDto> {
        const file = await this.filesService.getFileByUuid(uuid, req.user.userId)
        return this.filesService.getDownloadUrl(file.id, req.user.userId)
    }

    @Get(':id/download-zip')
    @ApiOperation({ summary: 'Download a directory as a ZIP file' })
    @ApiResponse({
        status: 200,
        description: 'Returns the directory contents as a ZIP file stream.',
    })
    @ApiNotFoundResponse({ description: 'Directory not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to access this directory.' })
    @ApiBadRequestResponse({ description: 'This is not a directory or the directory is empty.' })
    async downloadDirectoryAsZip(
        @Param() { id }: IdDto,
        @Request() req: AuthenticatedRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { stream, filename } = await this.filesService.downloadDirectoryAsZip(id, req.user.userId)

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        })

        return new StreamableFile(stream)
    }

    @Get('uuid/:uuid/download-zip')
    @ApiOperation({ summary: 'Download a directory as a ZIP file by UUID' })
    @ApiResponse({
        status: 200,
        description: 'Returns the directory contents as a ZIP file stream.',
    })
    @ApiNotFoundResponse({ description: 'Directory not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to access this directory.' })
    @ApiBadRequestResponse({ description: 'This is not a directory or the directory is empty.' })
    async downloadDirectoryAsZipByUuid(
        @Param() { uuid }: UuidDto,
        @Request() req: AuthenticatedRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const file = await this.filesService.getFileByUuid(uuid, req.user.userId)
        const { stream, filename } = await this.filesService.downloadDirectoryAsZip(file.id, req.user.userId)

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        })

        return new StreamableFile(stream)
    }

    // @Get('uuid/:uuid/breadcrumb')
    // @ApiOperation({ summary: 'Get breadcrumb trail for a directory' })
    // @ApiResponse({
    //     status: 200,
    //     description: 'Return breadcrumb trail from root to the specified directory.',
    //     type: [FileResponseDto],
    // })
    // @ApiNotFoundResponse({ description: 'Directory not found.' })
    // @ApiForbiddenResponse({ description: 'You do not have permission to access this directory.' })
    // @ApiBadRequestResponse({ description: 'Breadcrumb is only available for directories.' })
    // getBreadcrumb(@Param() { uuid }: UuidDto, @Request() req: AuthenticatedRequest): Promise<FileResponseDto[]> {
    //     return this.filesService.getBreadcrumb(uuid, req.user.userId)
    // }

    @Patch(':id/rename')
    @ApiOperation({ summary: 'Rename a file or directory' })
    @ApiResponse({ status: 200, description: 'File or directory renamed successfully.', type: FileResponseDto })
    @ApiNotFoundResponse({ description: 'File not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to rename this file.' })
    @ApiBadRequestResponse({ description: 'Invalid name or a file with this name already exists.' })
    async renameFile(
        @Param() { id }: IdDto,
        @Body() dto: RenameFileRequestDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<FileResponseDto> {
        return this.filesService.renameFile(id, dto.newName, req.user.userId)
    }

    @Patch(':id/move')
    @ApiOperation({ summary: 'Move a file or directory to a different parent directory' })
    @ApiResponse({ status: 200, description: 'File or directory moved successfully.', type: FileResponseDto })
    @ApiNotFoundResponse({ description: 'File or target parent directory not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to move this file.' })
    @ApiBadRequestResponse({
        description:
            'File is already in the target location, a file with this name exists in target, or cannot move directory into itself/descendant.',
    })
    async moveFile(
        @Param() { id }: IdDto,
        @Body() dto: MoveFileRequestDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<FileResponseDto> {
        return this.filesService.moveFile(id, req.user.userId, dto.targetParentUuid)
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a file or directory' })
    @ApiResponse({ status: 200, description: 'File or directory deleted successfully.' })
    @ApiNotFoundResponse({ description: 'File not found.' })
    @ApiForbiddenResponse({ description: 'You do not have permission to delete this file.' })
    @ApiBadRequestResponse({ description: 'Cannot delete a non-empty directory.' })
    async deleteFile(@Param() { id }: IdDto, @Request() req: AuthenticatedRequest): Promise<{ message: string }> {
        await this.filesService.deleteFile(id, req.user.userId)
        return { message: 'File or directory deleted successfully' }
    }
}
