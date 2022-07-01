import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

const VERSION = 'v1';
export const logger = new Logger('r/place-redis');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({logger: true})
  );
  app.setGlobalPrefix('/api/'+VERSION);
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
