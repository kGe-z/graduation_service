import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/* 返回信息体 */
export interface Response<T> {
  data: T;
}

/* 返回消息格式拦截器 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(map(data => ({ 
      statusCode: 200,
      message: 'success',
      data 
    })));
  }
}
