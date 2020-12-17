import { SetMetadata } from "@nestjs/common";

/* 无须 jwt 鉴权接口 */
export const NotJwtAuthGuard = (notJwtAuthGuard = 'NotJwtAuthGuard') => SetMetadata('NotJwtAuthGuard', notJwtAuthGuard)