import { IntersectionType } from '@nestjs/swagger'

import { UserDescriptionDto, EmailDto, NicknameDto, PasswordDto, UsernameDto } from 'modules/users/dto'

export class LoginDto extends IntersectionType(UsernameDto, PasswordDto) {}
export class RegisterDto extends IntersectionType(
    UsernameDto,
    NicknameDto,
    PasswordDto,
    EmailDto,
    UserDescriptionDto,
) {}
