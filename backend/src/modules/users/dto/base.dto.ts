import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, MaxLength, Matches, IsOptional, IsInt, IsBoolean } from 'class-validator'

export class UsernameDto {
    @ApiProperty({
        description: 'The username of the user.',
        example: 'foo',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
    @Matches(/^[a-z0-9_]+$/, { message: 'The username must be lowercase letters, numbers, or underscores.' })
    username: string
}

export class NicknameDto {
    @ApiProperty({
        description: 'The nickname of the user.',
        example: 'Kim Jun Young',
    })
    @IsString()
    @MaxLength(32)
    @IsOptional()
    nickname?: string
}

export class PasswordDto {
    @ApiProperty({
        description: 'The password of the user.',
        example: 'securePassword1234@',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    password: string
}

export class EmailDto {
    @ApiProperty({
        description: 'The email address of the user.',
        example: 'foo@example.com',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(320)
    @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    email: string
}

export class UserDescriptionDto {
    @ApiProperty({
        description: 'A brief description of the user.',
        example: 'Hello, I am a software developer.',
    })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string
}

export class ProfileImageDto {
    @ApiProperty({
        description: "The path to the user's profile image.",
        example: 'uploads/profile/1/profile.png',
    })
    @IsString()
    @IsOptional()
    @Matches(/^uploads\/profile\/\d+\/profile\.(jpg|jpeg|png|gif)$/)
    profileImage?: string
}

export class RoleDto {
    @ApiProperty({
        description: 'The role of the user. 0 for admin, 1 for user.',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    role: number
}
