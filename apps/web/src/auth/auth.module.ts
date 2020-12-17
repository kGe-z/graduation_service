import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TypegooseModule } from 'nestjs-typegoose';
// import { PassportModule } from '@nestjs/passport/dist/passport.module';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module'

import { JwtConfigService } from './config/jwt.config'
import { JwtStrategy } from './strategy/jwt.strategy';
import { MailerModule } from '@nestjs-modules/mailer'

import User from '@libs/db/model/user.model'
import Address from '@libs/db/model/address.model';

@Module({
  imports: [
    TypegooseModule.forFeature([User, Address]),
    // PassportModule,
    // jwt
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    // 邮箱验证码
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: process.env.MAILER_MODULE_TRANSPROT,
        defaults: {
          from: process.env.MAILER_MODULE_DEFAULT_FROM
        }
      })
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy]
})
export class AuthModule {}
