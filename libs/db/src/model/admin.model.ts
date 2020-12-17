import { modelOptions, prop } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'
import { hashSync } from 'bcryptjs'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export default class Admin {
  @ApiProperty({ description: '用户名' })
  @prop({ required: true, unique: true })
  public username: string

  @ApiProperty({ description: '名字' })
  @prop({ required: true, unique: true })
  public name: string

  @ApiProperty({ description: '邮箱' })
  @prop({ required: true, unique: true })
  public email: string

  @ApiProperty({ description: '密码' })
  @prop({
    get(val) {
      return val
    },
    set(val) {
      return hashSync(val)
    },
    select: false,
    required: true,
  })
  public password: string

  @ApiProperty({ description: '身份' })
  @prop({ default: 'business', enum: ['admin', 'business'] }) // 管理员 商家
  public role: string

  @ApiProperty({ description: '头像' })
  @prop({ default: 'http://localhost:3000/uploads/avatar/default/avatar.jpg' })
  public avatar: string

  @ApiProperty({ description: '禁启用' })
  @prop({ default: true, enum: [true, false] })
  public status: boolean

  @ApiProperty({ description: '申请状态' })
  @prop({ default: 2, enum: [1, 2] }) // 1 通过 2 申请
  public apply: number
}
