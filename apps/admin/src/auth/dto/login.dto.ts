import { ApiProperty } from '@nestjs/swagger';

export default class LoginDto {
  @ApiProperty({ description: '用户名称', example: 'admin' })
  username: string;
  @ApiProperty({ description: '密码', example: '123456' })
  password: string;
}