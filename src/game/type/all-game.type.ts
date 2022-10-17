import { GameSpec } from "../type/game-spec.type";
import { PixelAnon } from "src/pixel/dto/pixel-anon.dto";
import { UserSpec } from "./user-spec.type";

export type AllGame = GameSpec & { map: PixelAnon[], lastPixelPlaced: Date, now: Date, stickedPixels: number, bombs: number };