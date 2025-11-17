import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class StorageService {
    private readonly s3Client: S3Client
    private readonly bucketName: string

    constructor() {
        const region = process.env.AWS_REGION
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
        const bucketName = process.env.AWS_S3_BUCKET_NAME

        if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
            throw new InternalServerErrorException('AWS S3 configuration is missing')
        }

        this.s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        })
        this.bucketName = bucketName
    }

    async uploadFile(file: Express.Multer.File, userId: number, path: string = ''): Promise<string> {
        const originalName = file.originalname
        const lastDotIndex = originalName.lastIndexOf('.')
        const fileExtension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex + 1) : ''
        const fileName = fileExtension ? `${uuidv4()}.${fileExtension}` : uuidv4()
        const s3Key = `users/${userId}/${path}${fileName}`.replace(/\/+/g, '/')

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
        })

        await this.s3Client.send(command)

        return s3Key
    }

    async deleteFile(s3Key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
        })

        await this.s3Client.send(command)
    }

    async deleteFiles(s3Keys: string[]): Promise<void> {
        if (!s3Keys.length) return
        const chunkSize = 1000
        for (let i = 0; i < s3Keys.length; i += chunkSize) {
            const chunk = s3Keys.slice(i, i + chunkSize)
            const command = new DeleteObjectsCommand({
                Bucket: this.bucketName,
                Delete: {
                    Objects: chunk.map((Key) => ({ Key })),
                    Quiet: true,
                },
            })
            await this.s3Client.send(command)
        }
    }

    async getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
        })

        const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn })
        return presignedUrl
    }

    async getPresignedUrls(s3Keys: string[], expiresIn: number = 3600): Promise<string[]> {
        const urls = await Promise.all(s3Keys.map((key) => this.getPresignedUrl(key, expiresIn)))
        return urls
    }
}
