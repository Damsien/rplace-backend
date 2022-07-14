import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixelModule } from './pixel/pixel.module';
import { PixelHistoryService } from './pixel-history/pixel-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelHistory } from './pixel-history/entity/pixel-history.entity';
import { PixelSQL } from './pixel/entity/pixel-sql.entity';
import { PixelHistoryModule } from './pixel-history/pixel-history.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ENV == 'prod' ? '.env' : `.dev.env`,
      isGlobal: true
    }),
    PixelModule,
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.MARIADB_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.MARIADB_USER,
      password: process.env.MARIADB_PASSWORD,
      database: process.env.MARIADB_DATABASE,
      entities: [PixelSQL, PixelHistory],
      synchronize: (/true/i).test(process.env.MARIADB_DEV)
    }),
    PixelHistoryModule,
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
