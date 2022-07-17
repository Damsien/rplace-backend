import { Entity, Schema } from "redis-om";


export class Game extends Entity {

    name: string;

    user: string;

    startSchedule: Date;

    stopSchedule: Date;

    width: number;

    timer: number;

    colors: string[];

}

export const game_schema = new Schema(Game, {

    name: {type: 'string'},

    user: {type: 'string'},

    startSchedule: {type: 'date'},

    stopSchedule: {type: 'date'},

    width: {type: 'number'},

    timer: {type: 'number'},

    colors: {type: 'string[]'},

});