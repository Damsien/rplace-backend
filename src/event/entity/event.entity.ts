import { UserEntity } from "src/user/entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventType } from "./event.enum";

@Entity()
export class EventEntity {

    @PrimaryGeneratedColumn("increment")
    id: number;

    @Column()
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: "id" })
    user: string;

    @Column({
        type: 'enum',
        enum: EventType,
    })
    type: EventType;

    @Column('simple-array')
    values: string[];

    @Column({
        default: new Date()
    })
    schedule: Date;

}