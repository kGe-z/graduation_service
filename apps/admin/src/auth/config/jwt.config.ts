import { Injectable } from "@nestjs/common";
import { JwtOptionsFactory, JwtModuleOptions } from "@nestjs/jwt";

@Injectable()
export class JwtConfigService implements JwtOptionsFactory {
  createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions{
    return {
      secret: process.env.SERVER_JWT_SECRET,
      signOptions: {
        expiresIn: eval(process.env.SERVER_JWT_EXPRESSIN),
      }
    }
  }
}