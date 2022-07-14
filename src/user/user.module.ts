import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { UserService } from './user.service';

@Module({
  imports: [PuppeteerModule.forRoot({ pipe: true }), HttpModule],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
