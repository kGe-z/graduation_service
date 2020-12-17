import { CommonModule } from '@libs/common'
import { AllExceptionFilter } from '@libs/common/filter/all-exception.filter'
import { ResponseInterceptor } from '@libs/common/interceptor/response.interceptor'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { RedisModule } from 'nestjs-redis'
import { AppController } from './app.controller'
import { AddressModule } from './address/address.module';
import { GoodsModule } from './goods/goods.module';
import { OrderModule } from './order/order.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    CommentModule,
    // redis
    RedisModule.register({ url: process.env.REDIS_DB_URL }),
    AddressModule,
    GoodsModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    // {
    //   provide: APP_GUARD, // 全局 jwt
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
