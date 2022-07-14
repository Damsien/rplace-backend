import { Controller, Get, Post, UseGuards, Request, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AtAuthGuard } from './auth/guard/at-auth.guard';
import { LocalAuthGuard } from './auth/guard/local-auth.guard';
import { RtAuthGuard } from './auth/guard/rt-auth.guard';
import { Tokens } from './auth/type/tokens.type';
import { logger } from './main';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req): Promise<Tokens> {
    return await this.authService.loginOrRefresh(req.user);
  }

  @UseGuards(AtAuthGuard)
  @Get('protected')
  async getHello(@Request() req): Promise<string> {
    return await req.user;
  }

  @UseGuards(RtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req): Promise<Tokens> {
    return await this.authService.loginOrRefresh(req.user);
  }
}
