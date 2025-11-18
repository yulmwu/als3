import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Exclude } from 'class-transformer'
import { File } from '../files/files.entity'

export enum UserRole {
    ADMIN = 0,
    USER = 1,
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 32, unique: true })
    username: string

    @Column({ type: 'varchar', length: 32, nullable: true })
    nickname: string

    @Exclude()
    @Column({ type: 'varchar', length: 255, select: false })
    password: string

    @Column({ type: 'varchar', length: 320, unique: true })
    email: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    profileImage?: string

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole

    @OneToMany(() => File, (file) => file.user)
    files: File[]

    @Column({ type: 'bigint', unsigned: true, default: 0 })
    storageUsed: number

    @Column({ type: 'bigint', unsigned: true, default: 1073741824 })
    storageLimit: number

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date
}
