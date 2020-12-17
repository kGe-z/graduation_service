import Address from '@libs/db/model/address.model'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypegooseModule } from 'nestjs-typegoose'
import { JwtConfigService } from '../auth/config/jwt.config'
import { JwtStrategy } from '../auth/strategy/jwt.strategy'
import { AddressController } from './address.controller'

@Module({
  imports: [
    TypegooseModule.forFeature([Address]),
    // PassportModule,
    // jwt
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
  ],
  controllers: [AddressController],
  providers: [JwtStrategy]
})
export class AddressModule {}
