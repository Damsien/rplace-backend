import { UserPayload } from "src/auth/type/userpayload.type";

export type User = UserPayload & { password: string };