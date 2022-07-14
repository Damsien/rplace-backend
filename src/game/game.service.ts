import { Injectable } from '@nestjs/common';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { SizeMap } from './dto/size-map.dto';

@Injectable()
export class GameService {

    constructor(private readonly pixelHistoryService: PixelHistoryService) {}

    async createMap(map: SizeMap) {
      return await this.pixelHistoryService.createMap(map);
    }

    async increaseMapSize(map: SizeMap) {
      return await this.pixelHistoryService.increaseMapSize(map);
    }

}
