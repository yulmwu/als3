import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { FilesController } from './files.controller'
import { FilesService } from './files.service'
import { File } from './files.entity'
import { StorageModule } from 'common/storage/storage.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([File]),
        StorageModule,
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
