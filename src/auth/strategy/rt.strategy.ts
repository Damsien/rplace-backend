import { ForbiddenException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../type/jwtpayload.type";
import { UserPayload } from "../type/userpayload.type";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {

  constructor() {
    super({
        secretOrKey: 'RT-SECRET',
        ignoreExpiration: false,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        passReqToCallback: true
    });
  }

  validate(req: Request, payload: UserPayload): JwtPayload {
    const refreshToken = req.headers
      ?.get('authorization')
      ?.replace('Bearer', '')
      .trim();

    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');

    return {
      ...payload,
      refreshToken,
    };
  }
}