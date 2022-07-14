import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { logger } from "src/main";
import { Role } from "../type/role.enum";


@Injectable()
export class RolesGuard implements CanActivate {

    constructor(private reflector: Reflector, private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const role = this.reflector.getAllAndOverride<Role[]>('roles', [
            context.getHandler(),
            context.getClass()
        ])[0];

        if (!role) return true;

        const user = context.switchToHttp().getRequest().user;

        return this.checkRole(user.username, role);
    }

    private checkRole(username: string, role: Role): boolean {
        return this.configService.get<string>(role).split(',').find(el => el == username) != undefined;
    }

}