import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  app.enableCors({
    origin: configService.getOrThrow<string>('WEB_URL'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CLUTCHA API')
    .setDescription(
      'API documentation for the CLUTCHA online and on-site esports tournament platform.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the JWT access token',
      },
      'access-token',
    )
    .addCookieAuth(
      'clutcha_refresh',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'clutcha_refresh',
        description: 'HttpOnly refresh-token cookie',
      },
      'refresh-token',
    )
    .build();

  const swaggerApp = app;

  const swaggerDocumentFactory = () =>
    SwaggerModule.createDocument(swaggerApp, swaggerConfig, {
      operationIdFactory: (controllerKey: string, methodKey: string): string =>
        `${controllerKey}_${methodKey}`,
    });

  SwaggerModule.setup('docs', swaggerApp, swaggerDocumentFactory, {
    customSiteTitle: 'CLUTCHA API Documentation',
    jsonDocumentUrl: 'docs/openapi.json',
    yamlDocumentUrl: 'docs/openapi.yaml',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(configService.getOrThrow<number>('PORT'));
}
void bootstrap();
