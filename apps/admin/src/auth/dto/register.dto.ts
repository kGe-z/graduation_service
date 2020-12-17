import { ApiProperty } from '@nestjs/swagger';

export default class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;
  @ApiProperty({ description: '密码', example: '123456' })
  password: string;
  @ApiProperty({ description: '名字', example: 'oakley' })
  name: string
  @ApiProperty({ description: '头像', example: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=4209818664,2342461693&fm=11&gp=0.jpg' })
  avatar: string
  @ApiProperty({ description: '身份', example: 'business' })
  role: string
  @ApiProperty({ description: '邮箱', example: '123@qq.com' })
  email: string
  @ApiProperty({ description: '状态', example: false })
  status: boolean
  @ApiProperty({ description: '申请状态', example: 3 })
  apply: number
  @ApiProperty({ description: '验证码'})
  code: string
  @ApiProperty({ description: '模式'})
  model: string
}