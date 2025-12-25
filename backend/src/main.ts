import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupSwagger, TransformInterceptor, TypeOrmExceptionFilter } from '@als3/shared'
import { Logger, ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'

const PORT = process.env.PORT ?? 3000
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const USE_GLOBAL_PREFIX = process.env.USE_GLOBAL_PREFIX === 'true'

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule)

    if (USE_GLOBAL_PREFIX) app.setGlobalPrefix('api')
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    )
    app.useGlobalInterceptors(new TransformInterceptor())
    app.useGlobalFilters(new TypeOrmExceptionFilter())
    app.use(cookieParser())

    const devHosts = [4000, 5500].map((port) => `http://localhost:${port}`)
    app.enableCors({
        origin: IS_PRODUCTION ? process.env.FRONTEND_URL : devHosts,
        credentials: true,
    })

    const logger = new Logger('Bootstrap')

    if (!IS_PRODUCTION) {
        setupSwagger(app)
    }

    await app.listen(PORT)

    logger.log(`Application is running on: ${await app.getUrl()}`)
    logger.log(`API Test Page: http://localhost:${PORT}/`)

    if (!IS_PRODUCTION) {
        logger.log(`Swagger is available at: ${await app.getUrl()}/api-docs`)
    }
}

bootstrap()
