import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuppeteerModule } from 'nest-puppeteer';
import { UserEntity } from './entity/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { GameService } from 'src/game/game.service';

@Module({
  imports: [
    PuppeteerModule.forRoot({ pipe: true }),
    HttpModule,
    TypeOrmModule.forFeature([UserEntity])
  ],
  providers: [UserService, GameService],
  exports: [UserService],
  controllers: [UserController]
})
export class UserModule {}
