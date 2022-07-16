import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { logger } from "src/main";
import { Role } from "src/user/type/role.enum";

@Injectable()
export class EventGuard implements CanActivate {

    constructor(private reflector: Reflector, private configService: ConfigService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const user = context.switchToHttp().getRequest().user;

        return this.configService.get<string>(Role.ADMIN).split(',')
            .find(el => el == user.username) != undefined;
    }
    
}