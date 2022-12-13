import { GameSpec } from "./game-spec.type";
import { PixelAnon } from "src/pixel/dto/pixel-anon.dto";
import { UserSpec } from "./user-spec.type";

export type AllGlobalGame = GameSpec & { map: PixelAnon[] };