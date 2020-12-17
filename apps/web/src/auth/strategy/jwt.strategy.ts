import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt'
import { JwtInterface } from "../interface/jwt.interface";
import { Unauthorized } from "@libs/common/error/exception";
import { InjectModel } from "nestjs-typegoose";
import { ReturnModelType } from "@typegoose/typegoose";
import User from "@libs/db/model/user.model";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
  constructor(
    @InjectModel(User) private readonly userModel: ReturnModelType<typeof User>
  ){
    super({
      secretOrKey: process.env.WEB_JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false
    } as StrategyOptions)
  }

  async validate(payload: JwtInterface) {
    const _id = payload._id
    const user = await this.userModel.findById(_id)
    if(!user) throw new Unauthorized('token 错误')
    
    return user
  }
}