declare module 'passport-jwt' {
  import type { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport-strategy';

  export type JwtFromRequestFunction = (req: Request) => string | null;

  export interface StrategyOptions {
    jwtFromRequest: JwtFromRequestFunction;
    secretOrKey: string | Buffer;
    issuer?: string;
    audience?: string;
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback?: boolean;
    jsonWebTokenOptions?: {
      clockTolerance?: number;
      maxAge?: string;
    };
  }

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify?: any);
  }
}
