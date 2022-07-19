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
    timer: number = null;

    @Column("simple-array", {
        nullable: true
    })
    colors: string[] = null;

}