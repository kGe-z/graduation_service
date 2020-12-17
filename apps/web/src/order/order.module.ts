
import Goods from '@libs/db/model/goods.model';
import Order from '@libs/db/model/order.model';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypegooseModule } from 'nestjs-typegoose';
import { JwtConfigService } from '../auth/config/jwt.config';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { OrderController } from './order.controller';

@Module({
  imports: [
    TypegooseModule.forFeature([Order, Goods]),
    // jwt
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
  ],
  controllers: [OrderController],
  providers: [JwtStrategy]
})
export class OrderModule {}
