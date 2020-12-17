import { Global, Module } from '@nestjs/common'
import { TypegooseModule } from 'nestjs-typegoose'
import Address from './model/address.model'
import Admin from './model/admin.model'
import Banner from './model/banner.model'
import Comment from './model/comment.model'
import Goods from './model/goods.model'
import Order from './model/order.model'
import User from './model/user.model'

const models = TypegooseModule.forFeature([User, Admin, Goods, Banner, Address, Order, Comment])

@Global()
@Module({
  imports: [
    TypegooseModule.forRootAsync({
      useFactory() {
        return {
          uri: process.env.MONGO_DB_URL,
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useFindAndModify: false,
          useCreateIndex: true,
        }
      },
    }),
    models,
  ],
  providers: [],
  exports: [models],
})
export class DbModule {}
