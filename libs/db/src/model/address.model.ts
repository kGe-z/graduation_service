import { modelOptions, prop, Ref } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'
import User from './user.model'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export default class Address {
  @ApiProperty({ description: '默认' })
  @prop({ default: false })
  public default: boolean

  @ApiProperty({ description: '收件人' })
  @prop({ required: true })
  public name: string

  @ApiProperty({ description: '手机' })
  @prop({ required: true })
  public phone: number

  @ApiProperty({ description: '地址' })
  @prop({})
  public address: any

  @ApiProperty({ description: '详细地址' })
  @prop({})
  public detailed: string

  @ApiProperty({ description: '用户' })
  @prop({ required: true, ref: 'User' })
  public user_id: Ref<User>
}
