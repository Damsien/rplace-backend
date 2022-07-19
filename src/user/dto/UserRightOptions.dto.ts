import { GameSpec } from "src/game/type/game-spec.type";
import { PlaceSinglePixel } from "src/pixel/dto/place-single-pixel.dto";

export interface UserRightOptions {

    /**
     * User id 'pcsope.username'
     */
    userId: string,

    /**
     * The pixel that the user want to place
     */
    pixel: PlaceSinglePixel,

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
     colors: Array<string>
}
