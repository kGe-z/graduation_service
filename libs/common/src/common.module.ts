import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config' // 重要配置
import { DbModule } from '@libs/db'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // env 配置
    }),
    // JwtModule.registerAsync({
    //   useClass: JwtConfigService,
    // }),
    DbModule,
  ],
  exports: [],
})
export class CommonModule {}
