import { PixelSQL } from "src/pixel/entity/pixel-sql.entity";
import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";

@Entity()
export class PixelHistory {

    @PrimaryColumn()
    @OneToOne(() => PixelSQL)
    @JoinColumn({ name: "pixelId" })
    pixelId: number;

    @PrimaryColumn()
    date: Date;

    color: string;

    username: string;

}