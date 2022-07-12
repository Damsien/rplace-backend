import { Controller, Get, Post, UseGuards, Request, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AtAuthGuard } from './auth/guard/at-auth.guard';
import { LocalAuthGuard } from './auth/guard/local-auth.guard';
import { RtAuthGuard } from './auth/guard/rt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req): any {
    return this.authService.login(req.user);
  }

  @UseGuards(AtAuthGuard)
  @Get('protected')
  getHello(@Request() req): string {
    return req.user;
  }

  @UseGuards(RtAuthGuard)
  @Get('refresh')
  refresh(@Request() req): string {
    return req.user;
  }
}
