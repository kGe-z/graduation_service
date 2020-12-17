import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/* local 守卫 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}