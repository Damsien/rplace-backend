import { Injectable } from '@nestjs/common';
import { client } from 'src/app.service';
import { PlaceSinglePixel } from 'src/pixel/dto/place-single-pixel.dto';

@Injectable()
export class UserPixelHistoryService {

    async placeSinglePixel(pxl: PlaceSinglePixel) {
        let globalId = `${pxl.username}`;
        
        let userPixelHistoryId = `UserPixelHistory:${globalId}`;
      
        client.execute(['XADD', `${userPixelHistoryId}`, '*',
          'coord_x', pxl.coord_x,
          'coord_y', pxl.coord_y,
          'color', pxl.color,
          'date', pxl.date.getDate().toString()
        ]);
    }

}
