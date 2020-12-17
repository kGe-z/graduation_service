import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt'
import { JwtInterface } from "../interface/jwt.interface";
import { Unauthorized } from "@libs/common/error/exception";
import { InjectModel } from "nestjs-typegoose";
import { ReturnModelType } from "@typegoose/typegoose";
import Admin from "@libs/db/model/admin.model";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
  constructor(
    @InjectModel(Admin) private readonly adminModel: ReturnModelType<typeof Admin>
  ){
    super({
      secretOrKey: process.env.SERVER_JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false
    } as StrategyOptions)
  }

  async validate(payload: JwtInterface) {
    const _id = payload._id
    const user = await this.adminModel.findById(_id)

    if(!user) throw new Unauthorized('token 错误')
    
    return user
  }
}