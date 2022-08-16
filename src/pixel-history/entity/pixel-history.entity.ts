import { PixelEntity } from "../../pixel/entity/pixel-sql.entity";
import { UserEntity } from "../../user/entity/user-sql.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PixelHistoryEntity {

    @PrimaryGeneratedColumn('increment')
    id: number

    @Column()
    @ManyToOne(() => PixelEntity)
    @JoinColumn({ name: "pixelId" })
    pixelId: number;

    @Column()
    date: Date;

    @Column()
    color: string;

    @Column()
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: "userId" })
    userId: string;

    @Column()
    isSticked: boolean;

}