import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "../../user/entity/user-sql.entity";
import { PatternEntity } from "./pattern-sql.entity";


@Entity()
export class PatternBindEntity {

    @PrimaryColumn()
    @ManyToOne(() => PatternEntity)
    @JoinColumn({ name: "patternId" })
    patternId: string;

    @PrimaryColumn()
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: "userId" })
    userId: string;

}