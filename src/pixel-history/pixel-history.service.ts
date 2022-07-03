import { Injectable } from '@nestjs/common';
import { client } from 'src/app.service';
import { PlaceSinglePixel } from 'src/pixel/dto/place-single-pixel.dto';

@Injectable()
export class PixelHistoryService {

    async placeSinglePixel(pxl: PlaceSinglePixel) {
        let globalId = `${pxl.coord_x}-${pxl.coord_y}`;
        
        let pixelHistoryId = `PixelHistory:${globalId}`;
        
        client.execute(['XADD', `${pixelHistoryId}`, '*',
          'coord_x', pxl.coord_x,
          'coord_y', pxl.coord_y,
          'color', pxl.color,
          'username', pxl.username,
          'date', pxl.date.getDate().toString()
        ]);
    }

}
