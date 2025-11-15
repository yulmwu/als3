import { IntersectionType } from '@nestjs/swagger'
import { NicknameDto, ProfileImageDto, UserDescriptionDto } from './base.dto'

export class UserUpdateRequestDto extends IntersectionType(NicknameDto, UserDescriptionDto, ProfileImageDto) {}
