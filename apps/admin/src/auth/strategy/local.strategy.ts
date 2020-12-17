import { Unauthorized } from "@libs/common/error/exception";
import Admin from "@libs/db/model/admin.model";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport'
import { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from "nestjs-typegoose";
import { Strategy, IStrategyOptions } from 'passport-local'
import { compareSync } from 'bcryptjs'


/* 配置策略 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    // private readonly authService: AuthService
    @InjectModel(Admin) private readonly adminModel: ReturnModelType<typeof Admin>
  ) {
    super({
      usernameField: 'username',
      passwordField: 'password'
    } as IStrategyOptions )
  }
  

  /* 校验 */
  async validate(username: string, password: string) {
    const user = await this.adminModel.findOne({username}).select('+password')

    if(!user) throw new Unauthorized('未找到该用户')
    if(!compareSync(password, user.password)) throw new Unauthorized('密码错误')

    return user
  }
}