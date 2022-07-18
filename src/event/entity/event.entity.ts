import { UserEntity } from "src/user/entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventType } from "./event.enum";

@Entity()
export class EventEntity {

    @PrimaryGeneratedColumn("increment")
    eventId: number;

    @Column()
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: "userId" })
    userId: string;

    @Column({
        type: 'enum',
        enum: EventType,
    })
    type: EventType;

    @Column('simple-array')
    values: string[];

    @Column()
    schedule: Date;

}