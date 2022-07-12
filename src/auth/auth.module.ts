import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { AtStrategy } from './strategy/at.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { RtStrategy } from './strategy/rt.strategy';

@Module({
  imports: [UserModule, PassportModule, JwtModule.register({})],
  providers: [AuthService, LocalStrategy, AtStrategy, RtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
