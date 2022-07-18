import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AtStrategy } from './strategy/at.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { RtStrategy } from './strategy/rt.strategy';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([UserEntity, PixelEntity, PixelHistoryEntity]),
    PassportModule,
    JwtModule.register({}),
    HttpModule
  ],
  providers: [AuthService, LocalStrategy, AtStrategy, RtStrategy, UserService],
  exports: [AuthService]
})
export class AuthModule {}
