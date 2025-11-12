import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@Controller()
@ApiTags('App')
export class AppController {
    constructor() {}

    @Get('health')
    @ApiOperation({ summary: 'Health check endpoint', description: 'Returns OK if the server is running' })
    health() {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        }
    }
}
