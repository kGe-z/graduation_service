import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app
    /* 静态资源 */
    .useStaticAssets('uploads', {
      prefix: '/uploads',
    })
    /* 跨域 */
    .enableCors()

  // 接口文档
  const options = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_WEB_TITLE)
    .setDescription(process.env.SWAGGER_WEB_VERSION)
    .setVersion(process.env.SWAGGER_WEB_DESCRIPTION)
    //.addTag('cats')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(process.env.SWAGGER_WEB_URL, app, document);


  // 服务端端口
  const PORT = process.env.APP_WEB_PORT
  
  await app.listen(PORT);
}
bootstrap();
