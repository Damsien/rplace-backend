import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class GroupEntity {

    @PrimaryColumn()
    group: string;

}