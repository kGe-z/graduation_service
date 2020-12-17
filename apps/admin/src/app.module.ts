import { CommonModule } from '@libs/common'
import { AllExceptionFilter } from '@libs/common/filter/all-exception.filter'
import { ResponseInterceptor } from '@libs/common/interceptor/response.interceptor'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guard/jwt.guard'
import { AppController } from './app.controller'
import { UserModule } from './user/user.module';
import { RedisModule } from 'nestjs-redis'
import { GoodModule } from './good/good.module';
import { BannerModule } from './banner/banner.module';
import { OrderController } from './order/order.controller';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UserModule,
    RedisModule.register({ url: process.env.REDIS_DB_URL }),
    GoodModule,
    BannerModule,
    OrderModule,
  ],
  controllers: [AppController, OrderController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_GUARD, // 全局 jwt
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
