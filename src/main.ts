import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';

const VERSION = 'v1';
export const logger = new Logger('r/place');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({logger: true})
  );
  app.setGlobalPrefix('/api/'+VERSION);
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));
  app.enableCors({
    allowedHeaders:"*",
    origin: "*",
    methods: "*"
  });
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
