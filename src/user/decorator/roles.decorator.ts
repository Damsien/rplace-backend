import { SetMetadata } from "@nestjs/common";
import { Role } from "../type/role.enum";

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles)