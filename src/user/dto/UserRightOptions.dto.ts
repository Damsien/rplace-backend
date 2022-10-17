import { Color } from "src/game/type/color.type";
import { GameSpec } from "src/game/type/game-spec.type";
import { PlaceSinglePixel } from "src/pixel/dto/place-single-pixel.dto";
import { Pixel } from "src/pixel/entity/pixel.entity";

export interface UserRightOptions {

    /**
     * User id 'pcsope.username'
     */
    userId: string,

    /**
     * The number of sticked pixels avalaible for the user
     */
    stickedPixelAvailable: number,

    /**
     * The pixel that the user want to place
     */
    pixel: PlaceSinglePixel,

    /**
     * The current pixel placed on the map at this coordinate
     */
    oldPixel: Pixel;

    /**
     * The game specs the user is involved in
     */
    game: GameSpec,

    /**
     * The date the pixel will be placed
     */
    date: Date,

    /**
     * Last date the user placed a pixel
     */
    lastPlacedPixelDate: Date

    /**
     * The offset between each pixel placement for the user
     * It can be the default offset defined by the game or a custom offset for that user
     */
    offset: number;

     /**
      * The colors the user can use
      */
    colors: Array<String>
}
