import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Unauthorized } from "@libs/common/error/exception";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";

/* Jwt 守卫 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector:Reflector
  ) {super()}

  /* 校验扩展 */
  /* 最后调用父类的 canActivate 才会执行原来的 passport-jwt 校验逻辑 */
  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const notJwtAuthGuardKey = 'NotJwtAuthGuard'
    const notJwtAuthGuards = this.reflector.getAllAndMerge<string[]>(notJwtAuthGuardKey, [
      ctx.getHandler(),
      ctx.getClass()
    ])

    let hasJwtAuthGuardKey = false
    
    if(typeof notJwtAuthGuards === 'string') {
      hasJwtAuthGuardKey = notJwtAuthGuards === notJwtAuthGuardKey
    }
    
    if(Array.isArray(notJwtAuthGuards)) {
      hasJwtAuthGuardKey = notJwtAuthGuards.some(item => item === notJwtAuthGuardKey)
    }

    if(hasJwtAuthGuardKey) {
      /* 无 token 访问 */
      return true
    }
    
    return super.canActivate(ctx)
  }

  /* 异常处理 */
  handleRequest(err, user, info) {
    if(err || !user) throw (err || new Unauthorized('未授权'))
    return user
  }
}