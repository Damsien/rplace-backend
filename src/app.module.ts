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
import { UserEntity } from './user/entity/user-sql.entity';
import { PixelService } from './pixel/pixel.service';
import { PixelHistoryService } from './pixel-history/pixel-history.service';
import { HttpModule } from '@nestjs/axios';
import { RunnerModule } from './runner/runner.module';
import { RunnerService } from './runner/runner.service';
import { RunnerGateway } from './runner/runner.gateway';
import { PatternModule } from './pattern/pattern.module';
import { PatternShapeService } from './pattern-shape/pattern-shape.service';
import { PatternShapeModule } from './pattern-shape/pattern-shape.module';
import { PatternEntity } from './pattern/entity/pattern-sql.entity';
import { PatternShapeEntity } from './pattern-shape/entity/pattern-shape-sql.entity';
import { PatternBindEntity } from './pattern/entity/pattern-bind-sql.entity';

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
      entities: [PixelEntity, PixelHistoryEntity, EventEntity, UserEntity, PatternEntity, PatternShapeEntity, PatternBindEntity],
      synchronize: true
    }),
    TypeOrmModule.forFeature([EventEntity, PixelHistoryEntity, PixelEntity, PatternShapeEntity]),
    PixelHistoryModule,
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    GameModule,
    EventModule,
    HttpModule,
    RunnerModule,
    PatternModule,
    PatternShapeModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    GameService,
    EventService,
    PixelService,
    PixelHistoryService,
    RunnerService,
    RunnerGateway,
    PatternShapeService
  ],
})
export class AppModule {}
