import { Pixel } from "src/pixel/entity/pixel.entity";

export type Game = {
    pixels: Pixel[];
    timer: number;  // in second
}