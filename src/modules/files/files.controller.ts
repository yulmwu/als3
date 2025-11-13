import {
    Controller,
    Post,
    Get,
    Delete,
    Query,
    Param,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
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
} from '@nestjs/swagger'
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard'
import { AuthenticatedRequest } from 'common/types/express-request.interface'
import { FilesService } from './files.service'
import { IdDto } from 'common/dto/base.dto'
import {
    FileResponseDto,
    FileWithDownloadUrlResponseDto,
    ListFilesResponseDto,
    CreateDirectoryRequestDto,
    ListFilesRequestDto,
} from './dto'

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
                path: {
                    type: 'string',
                    description: 'The directory path to upload the file to (must be an existing directory)',
                    default: '/',
                    example: '/documents/',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully.', type: FileResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid file, path does not exist, or file with same name already exists.' })
    @ApiNotFoundResponse({ description: 'The specified directory path does not exist.' })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('path') path: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<FileResponseDto> {
        return this.filesService.uploadFile(file, req.user.userId, path)
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
                    path: '/',
                },
            },
            nested: {
                summary: 'Create nested directory',
                value: {
                    name: 'subfolder',
                    path: '/documents/',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Directory created successfully.', type: FileResponseDto })
    @ApiBadRequestResponse({
        description:
            'Invalid directory name (contains special characters, slashes, or is empty), parent path does not exist, or directory with same name already exists.',
    })
    @ApiNotFoundResponse({ description: 'The parent directory path does not exist.' })
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
