import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import * as bcrypt from 'bcrypt';
import { GroupEntity } from "./group-sql.entity";

@Entity()
export class UserEntity {

    @BeforeInsert()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, Number(bcrypt.genSaltSync()));
        }
    }

    @PrimaryColumn()
    userId: string;     // pcsope.username

    @Column()
    username: string;

    @Column()
    pscope: string;

    @Column({
        nullable: true
    })
    password: string;

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

    @Column({
        nullable: true
    })
    @ManyToOne(() => GroupEntity)
    @JoinColumn({ name: "group" })
    group: string;

}