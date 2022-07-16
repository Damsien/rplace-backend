import { GameSpec } from "../type/game-spec.type";
import { Pixel } from "../../pixel/entity/pixel.entity";

export type AllGame = GameSpec & { map: Pixel[] };