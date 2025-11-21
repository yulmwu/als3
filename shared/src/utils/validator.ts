import { BadRequestException } from '@nestjs/common'

export const validateDirectoryName = (name: string) => {
    if (!name || name.trim() === '') throw new BadRequestException('Directory name cannot be empty')
    if (name.includes('/')) throw new BadRequestException('Directory name cannot contain slashes')
    const invalidChars = /[<>:"|?*\x00-\x1f]/
    if (invalidChars.test(name)) throw new BadRequestException('Directory name contains invalid characters')
    if (name === '.' || name === '..') throw new BadRequestException('Directory name cannot be "." or ".."')
    if (name.startsWith(' ') || name.endsWith(' ') || name.startsWith('.') || name.endsWith('.'))
        throw new BadRequestException('Directory name cannot start or end with spaces or dots')
    if (name.length > 255) throw new BadRequestException('Directory name is too long (max 255 characters)')
}

export const validateFileName = (name: string) => {
    if (!name || name.trim() === '') throw new BadRequestException('File name cannot be empty')
    if (name.includes('/') || name.includes('\\'))
        throw new BadRequestException('File name cannot contain slashes or backslashes')
    const invalidChars = /[<>:"|?*\x00-\x1f]/
    if (invalidChars.test(name)) throw new BadRequestException('File name contains invalid characters')
    if (name === '.' || name === '..') throw new BadRequestException('File name cannot be "." or ".."')
    const trimmedName = name.trim()
    if (trimmedName.startsWith('.') && trimmedName.length > 1 && trimmedName.charAt(1) === '.')
        throw new BadRequestException('File name cannot start with ".."')
    if (name.length > 255) throw new BadRequestException('File name is too long (max 255 characters)')
}
