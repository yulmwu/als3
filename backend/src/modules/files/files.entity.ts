import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Generated,
} from 'typeorm'
import { User } from '../users/users.entity'

export enum FileType {
    FILE = 'file',
    DIRECTORY = 'directory',
}

@Entity('files')
export class File {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'uuid', unique: true })
    @Generated('uuid')
    uuid: string

    @Column({ type: 'varchar', length: 255 })
    name: string

    @Column({ type: 'enum', enum: FileType })
    type: FileType

    @Column({ type: 'varchar', length: 1024, nullable: true })
    s3Key?: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    mimeType?: string

    @Column({ type: 'bigint', nullable: true })
    size?: number

    @Column({ type: 'varchar', length: 2048, default: '/' })
    path: string

    @Column({ type: 'int', nullable: true })
    parentId?: number

    @ManyToOne(() => File, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent?: File

    @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User

    @Column({ type: 'int' })
    userId: number

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date
}
