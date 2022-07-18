import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixelModule } from './pixel/pixel.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelHistoryModule } from './pixel-history/pixel-history.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { EventModule } from './event/event.module';
import { PixelHistoryEntity } from './pixel-history/entity/pixel-history.entity';
import { PixelEntity } from './pixel/entity/pixel-sql.entity';
import { GameService } from './game/game.service';
import { EventService } from './event/event.service';
import { EventEntity } from './event/entity/event.entity';
import { UserEntity } from './user/entity/user.entity';
import { PixelService } from './pixel/pixel.service';
import { EventTriggerService } from './event/event-trigger.service';
import { PixelHistoryService } from './pixel-history/pixel-history.service';
import { HttpModule } from '@nestjs/axios';

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
      entities: [PixelEntity, PixelHistoryEntity, EventEntity, UserEntity],
      synchronize: (/true/i).test(process.env.MARIADB_DEV)
    }),
    TypeOrmModule.forFeature([EventEntity, PixelHistoryEntity, PixelEntity]),
    PixelHistoryModule,
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    GameModule,
    EventModule,
    HttpModule
  ],
  controllers: [AppController],
  providers: [AppService, GameService, EventService, PixelService, EventTriggerService, PixelHistoryService],
})
export class AppModule {}
