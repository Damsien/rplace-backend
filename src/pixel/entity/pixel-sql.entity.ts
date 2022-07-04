import { Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class PixelSQL {

    @PrimaryGeneratedColumn("increment")
    pixelId: number;

    coord_x: number;

    coord_y: number;

}