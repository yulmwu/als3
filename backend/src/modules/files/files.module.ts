import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { FilesController } from './files.controller'
import { FilesService } from './files.service'
import { File } from './files.entity'
import { StorageModule } from 'common/storage/storage.module'
import { ZipModule } from 'common/zip/zip.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([File]),
        StorageModule,
        ZipModule,
        MulterModule.register({
            limits: {
                fileSize: 100 * 1024 * 1024,
                files: 1,
            },
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService],
    exports: [FilesService],
})
export class FilesModule {}
