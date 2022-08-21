import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PixelEntity } from "../../pixel/entity/pixel-sql.entity";
import { PatternEntity } from "../../pattern/entity/pattern-sql.entity";


@Entity()
export class PatternShapeEntity {

    @PrimaryGeneratedColumn("increment")
    patternShapeId: number;

    @Column()
    @ManyToOne(() => PatternEntity)
    @JoinColumn({ name: "patternId" })
    patternId: number;

    @Column()
    @ManyToOne(() => PixelEntity)
    @JoinColumn({ name: "userId" })
    pixelId: number;

    @Column()
    color: string;

}