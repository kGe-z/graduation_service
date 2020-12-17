import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Unauthorized } from "@libs/common/error/exception";
import { Observable } from "rxjs";

/* Jwt 守卫 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {super()}

  /* 校验扩展 */
  /* 最后调用父类的 canActivate 才会执行原来的 passport-jwt 校验逻辑 */
  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(ctx)
  }

  /* 异常处理 */
  handleRequest(err, user, info) {
    if(err || !user) throw (err || new Unauthorized('未授权'))
    return user
  }
}