import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'redis-om';

export const client = new Client();

@Injectable()
export class AppService {
  
    constructor(private configService: ConfigService) {
        client.open(this.configService.get<string>('REDIS_HOST'));
    }

}
