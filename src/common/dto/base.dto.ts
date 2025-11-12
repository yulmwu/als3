import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsInt, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class IdDto {
    @ApiProperty({
        description: 'The ID of the resource.',
        example: 1,
    })
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    id: number
}

export class CreatedAtDto {
    @ApiProperty({
        description: 'The creation date of the resource.',
        example: '2023-10-01T12:00:00Z',
    })
    @Type(() => Date)
    @IsNotEmpty()
    @IsString()
    createdAt: Date
}
