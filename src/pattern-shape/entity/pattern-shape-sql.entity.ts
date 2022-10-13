import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { PixelEntity } from "../../pixel/entity/pixel-sql.entity";
import { PatternEntity } from "../../pattern/entity/pattern-sql.entity";


@Entity()
export class PatternShapeEntity {
    
    @PrimaryColumn()
    @ManyToOne(() => PatternEntity)
    @JoinColumn({ name: "patternId" })
    patternId: string;

    @PrimaryColumn()
    @ManyToOne(() => PixelEntity)
    @JoinColumn({ name: "userId" })
    pixelId: number;

    @Column()
    color: string;

}