import { Injectable } from '@nestjs/common';
import { Client } from 'redis-om';

export const client = new Client();

@Injectable()
export class AppService {
  
    constructor() {
        client.open('redis://localhost:6379');
    }

}
