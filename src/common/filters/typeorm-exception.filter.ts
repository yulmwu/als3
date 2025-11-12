import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { Response } from 'express'
import { QueryFailedError } from 'typeorm'

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()

        const err = exception as unknown as { code: string; detail: string }

        if (process.env.NODE_ENV !== 'production') {
            console.error('TypeORM Error:', err)
        }

        let statusCode = 500
        let message = `Database error: ${err.code}`
        let error = 'InternalServerError'

        switch (err.code) {
            case '23505':
                statusCode = 409
                message = 'Resource already exists'
                error = 'Conflict'
                break
            case '23503':
                statusCode = 404
                message = 'Related resource not found'
                error = 'NotFound'
                break
            case '23502':
                statusCode = 400
                message = 'Missing required field'
                error = 'BadRequest'
                break
            case '22001':
                statusCode = 400
                message = 'Data too long for column'
                error = 'BadRequest'
                break
        }

        message = `${message}: ${err.detail || 'Unknown error'}`

        response.status(statusCode).json({
            statusCode,
            message,
            error,
        })
    }
}
