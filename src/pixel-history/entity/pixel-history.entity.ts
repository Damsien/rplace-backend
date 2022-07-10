import { PixelSQL } from "../../pixel/entity/pixel-sql.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PixelHistory {

    // @PrimaryGeneratedColumn('increment')
    // id: number

    @PrimaryColumn()
    @ManyToOne(() => PixelSQL)
    @JoinColumn({ name: "pixelId" })
    pixelId: number;

    @PrimaryColumn()
    date: Date;

    @Column()
    color: string;

    @Column()
    username: string;

}