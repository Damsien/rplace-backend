import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixelModule } from './pixel/pixel.module';
import { PixelHistoryService } from './pixel-history/pixel-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelHistory } from './pixel-history/entity/pixel-history.entity';
import { PixelSQL } from './pixel/entity/pixel-sql.entity';

@Module({
  imports: [PixelModule,
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'rplace',
      entities: [PixelHistory, PixelSQL],
      synchronize: true,
    }),],
  controllers: [AppController],
  providers: [AppService, PixelHistoryService],
})
export class AppModule {}
