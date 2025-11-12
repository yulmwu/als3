import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AccessTokenDto {
    @ApiProperty({ description: 'Access token for authenticated user', example: 'XXX.YYY.ZZZ' })
    @IsString()
    @IsNotEmpty()
    accessToken: string
}
