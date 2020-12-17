import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorTypeEnum, ErrorValueEnum } from '../error/error.enum';

/* 异常过滤器 */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    /* 取异常的 status 和 message */
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    
    const errorCode = exception.response?.statusCode || ErrorTypeEnum.ERROR_TYPE_DEFAULT
    const message = exception.message || ErrorValueEnum.ERROR_TYPE_DEFAULT

    response
      .status(status)
      .json({
        statusCode: status,                           // 状态码
        errorCode,                                    // 自定义错误码
        message,                                      // 错误消息
        request: `${request.method} ${request.path}`, // 请求路径
        timestamp: new Date().toISOString(),          // 响应时间戳
        path: request.url,                            // 请求地址
      });
  }
}