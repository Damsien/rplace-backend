import { GameSpec } from "./game-spec.type";

export type ServerGameSpec = GameSpec & { isMapReady: boolean };