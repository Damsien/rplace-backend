import { IsOptional } from "class-validator";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class UserEntity {

    @PrimaryColumn()
    id: string;     // pcsope.username

    @Column()
    username: string;

    @Column()
    pscope: string;

    @IsOptional()
    @Column()
    timer: number = null;

    @IsOptional()
    @Column("simple-array")
    colors: string[] = null;

}