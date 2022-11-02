import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class GroupEntity {

    @PrimaryColumn()
    name: string;

    @Column('simple-array', {nullable: true})
    alternatives: string[];

}