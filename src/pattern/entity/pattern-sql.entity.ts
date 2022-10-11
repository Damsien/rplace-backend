import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "../../user/entity/user-sql.entity";


@Entity()
export class PatternEntity {

    @PrimaryGeneratedColumn("uuid")
    patternId: string;

    @Column()
    name: string;

    @Column()
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: "userId" })
    userId: string;

}