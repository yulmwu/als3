import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupSwagger } from './common/utils/setupSwagger'
import { Logger, ValidationPipe } from '@nestjs/common'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter'
import * as cookieParser from 'cookie-parser'

const PORT = process.env.PORT ?? 3000
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule)
    app.setGlobalPrefix('api')
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

    if (!IS_PRODUCTION) {
        logger.log(`Swagger is available at: ${await app.getUrl()}/api-docs`)
    }
}

bootstrap()
