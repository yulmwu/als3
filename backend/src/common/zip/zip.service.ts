import { Injectable, BadRequestException } from '@nestjs/common'
import * as archiver from 'archiver'
import { Readable } from 'stream'

export interface FileToZip {
    name: string
    path: string
    content: Buffer | Readable
}

export interface ZipStreamContext {
    archive: archiver.Archiver
    stream: Readable
    rootName?: string
}

@Injectable()
export class ZipService {
    async createZip(files: FileToZip[]): Promise<Readable> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided for ZIP creation')
        }

        const archive = archiver('zip', {
            zlib: { level: 9 },
        })

        archive.on('error', (err) => {
            throw new BadRequestException(`Failed to create ZIP: ${err.message}`)
        })

        for (const file of files) {
            if (Buffer.isBuffer(file.content)) {
                archive.append(file.content, { name: file.path })
            } else {
                archive.append(file.content as Readable, { name: file.path })
            }
        }

        archive.finalize()

        return archive as unknown as Readable
    }

    async createZipWithStructure(rootName: string, files: FileToZip[]): Promise<Readable> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided for ZIP creation')
        }

        const archive = archiver('zip', {
            zlib: { level: 9 },
        })

        archive.on('error', (err) => {
            throw new BadRequestException(`Failed to create ZIP: ${err.message}`)
        })

        for (const file of files) {
            const zipPath = `${rootName}/${file.path}`
            if (Buffer.isBuffer(file.content)) {
                archive.append(file.content, { name: zipPath })
            } else {
                archive.append(file.content as Readable, { name: zipPath })
            }
        }

        archive.finalize()

        return archive as unknown as Readable
    }

    createZipStreamForDirectory(rootName: string): ZipStreamContext {
        const archive = archiver('zip', {
            zlib: { level: 6 },
        })

        archive.on('error', (err) => {
            console.error('Archive error:', err)
        })

        return {
            archive,
            stream: archive as unknown as Readable,
            rootName,
        }
    }

    addFilesToZip(context: ZipStreamContext, files: FileToZip[]): void {
        for (const file of files) {
            const zipPath = context.rootName ? `${context.rootName}/${file.path}` : file.path

            if (Buffer.isBuffer(file.content)) {
                context.archive.append(file.content, { name: zipPath })
            } else {
                context.archive.append(file.content as Readable, { name: zipPath })
            }
        }
    }

    finalizeZip(context: ZipStreamContext): void {
        context.archive.finalize()
    }
}
