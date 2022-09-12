export type UserSpec = {
    now: Date,
    lastPixelPlaced: Date,
    timer: number;
    colors: string[];
    pixelsPlaced: number;
    isGold: boolean;
    bombs: number;
    stickedPixels: number;
    rank: number;
    favColor: string;
}