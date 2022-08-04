import { GameSpec } from "../type/game-spec.type";
import { PixelAnon } from "src/pixel/dto/pixel-anon.dto";

export type AllGame = GameSpec & { map: PixelAnon[] };