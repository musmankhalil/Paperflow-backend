import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors();
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  // Increase JSON payload size limit
  const maxFileSize = configService.get<number>('MAX_FILE_SIZE', 10485760); // Default 10MB
  app.use(bodyParser.json({ limit: maxFileSize }));
  app.use(bodyParser.urlencoded({ extended: true, limit: maxFileSize }));
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('PaperFlow API')
    .setDescription('REST API for PDF manipulation and processing')
    .setVersion('1.0.0')
    .addTag('pdf-info', 'PDF information and metadata operations')
    .addTag('pdf-merge', 'PDF merging operations')
    .addTag('pdf-split', 'PDF splitting operations')
    .addTag('pdf-extract', 'PDF page extraction operations')
    .addTag('pdf-rotate', 'PDF page rotation operations')
    .addTag('pdf-compress', 'PDF compression operations')
    .addTag('pdf-utils', 'PDF utility operations')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}
bootstrap();