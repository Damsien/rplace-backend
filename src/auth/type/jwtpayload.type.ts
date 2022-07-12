import { UserPayload } from "./userpayload.type";

export type JwtPayload = UserPayload & { refreshToken: string };