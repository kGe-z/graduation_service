import { ApiProperty } from '@nestjs/swagger';

export default class RegisterDto {
  @ApiProperty({ description: '用户名称', example: 'admin' })
  username: string;
  @ApiProperty({ description: '密码', example: '123456' })
  password: string;
  @ApiProperty({ description: '名字', example: 'oakley' })
  name: string
  @ApiProperty({ description: '头像', example: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=4209818664,2342461693&fm=11&gp=0.jpg' })
  avatar: string
  @ApiProperty({ description: '性别', example: '男' })
  sex: string
  @ApiProperty({ description: '邮箱', example: '123@qq.com' })
  email: string
  @ApiProperty({ description: '简介', example: 'oakley' })
  autograph: string
  @ApiProperty({ description: '状态', example: true })
  status: boolean
}