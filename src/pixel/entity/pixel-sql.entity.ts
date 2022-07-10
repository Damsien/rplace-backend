import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class PixelSQL {

    @PrimaryGeneratedColumn("increment")
    pixelId: number;

    @Column()
    coord_x: number;

    @Column()
    coord_y: number;

}