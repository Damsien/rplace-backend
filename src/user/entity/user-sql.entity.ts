import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class UserEntity {

    @PrimaryColumn()
    userId: string;     // pcsope.username

    @Column()
    username: string;

    @Column()
    pscope: string;

    @Column({
        nullable: true
    })
    stickedPixelAvailable: number;

    @Column({
        nullable: true
    })
    bombAvailable: number;

    @Column({
        nullable: true
    })
    isUserGold: boolean;

}