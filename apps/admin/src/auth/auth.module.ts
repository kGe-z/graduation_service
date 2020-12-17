import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import User from '@libs/db/model/user.model'
import { TypegooseModule } from 'nestjs-typegoose';
import { PassportModule } from '@nestjs/passport/dist/passport.module';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module'

import { LocalStrategy } from './strategy/local.strategy';
import { JwtConfigService } from './config/jwt.config'
import { JwtStrategy } from './strategy/jwt.strategy';
import { MailerModule } from '@nestjs-modules/mailer'

@Module({
  imports: [
    TypegooseModule.forFeature([User]),
    PassportModule,
    // jwt
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    // 邮箱验证码
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: process.env.MAILER_MODULE_TRANSPROT,
        defaults: {
          from: '验证 <2942195657@qq.com>'
        }
      })
    }),
  ],
  controllers: [AuthController],
  providers: [LocalStrategy, JwtStrategy]
})
export class AuthModule {}
