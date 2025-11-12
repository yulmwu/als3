import { IntersectionType } from '@nestjs/swagger'
import { CreatedAtDto, IdDto } from 'common/dto'
import { EmailDto, NicknameDto, UsernameDto, RoleDto, UserDescriptionDto, ProfileImageDto } from '.'

export class UserResponseDto extends IntersectionType(
    IdDto,
    UsernameDto,
    NicknameDto,
    EmailDto,
    UserDescriptionDto,
    ProfileImageDto,
    CreatedAtDto,
    RoleDto,
) {}

export class UserBriefResponseDto extends IntersectionType(
    IdDto,
    UsernameDto,
    NicknameDto,
    UserDescriptionDto,
    ProfileImageDto,
    RoleDto,
) {}
