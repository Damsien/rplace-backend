import { Entity, Schema } from "redis-om";
import { Color } from "src/game/type/color.type";

export class User extends Entity {

    timer: number;

    lastPlacedPixel: Date;

    private colors: string;

    setColors(colors: Color[]) {
        this.colors = JSON.stringify(colors);
    }

    addColors(colors: Color[]) {
        const jsonColors: Color[] = JSON.parse(this.colors);
        for (let color of colors) {
            jsonColors.push(color);
        }
        this.colors = JSON.stringify(jsonColors);
    }

    getColors(): Color[] {
        return JSON.parse(this.colors);
    }

    getColorsName() {
        try {
            let colors = [];
            for (let color of this.getColors()) {
                colors.push(color.name);
            }
            return colors;
        } catch(err) {
            return null;
        }
    }

    getColorsHex() {
        try {
            let colors = [];
            for (let color of this.getColors()) {
                colors.push(Object.values(color)[0]);
            }
            return colors;
        } catch(err) {
            return null;
        }
    }

    getHexFromName(name: string) {
        for (let color of this.getColors()) {
            if(color.name == name) {
                return color.hex;
            }
        }
    }

    stickedPixelAvailable: number;

    bombAvailable: number;

    isUserGold: boolean;

    pixelsPlaced: number;

}

export const user_schema = new Schema(User, {

    timer: {type: 'number'},

    lastPlacedPixel: {type: 'date'},

    colors: {type: 'text'},

    stickedPixelAvailable: {type: 'number'},

    bombAvailable: {type: 'number'},

    isUserGold: {type: 'boolean'},

    pixelsPlaced: {type: 'number'}

});