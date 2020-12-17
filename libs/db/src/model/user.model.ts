import Goods from '@libs/db/model/goods.model'
import Admin from '@libs/db/model/admin.model'
import { modelOptions, prop, Ref } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'
import { hashSync } from 'bcryptjs'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export default class User {
  @ApiProperty({ description: '名字' })
  @prop({ required: true, unique: true })
  public name: string

  @ApiProperty({ description: '邮箱' })
  @prop({ unique: true, sparse: true })
  public email: string

  @ApiProperty({ description: '手机' })
  @prop({ unique: true, sparse: true })
  public phone: number

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

  @ApiProperty({ description: '头像' })
  @prop({
    default:
      'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2622933625,920552892&fm=26&gp=0.jpg',
  })
  public avatar: string

  @ApiProperty({ description: '性别' })
  @prop({ default: 2, enum: [0, 1, 2] })
  public sex: number

  @ApiProperty({ description: '简介' })
  @prop()
  public autograph: string

  @ApiProperty({ description: '禁启用' })
  @prop({ default: true, enum: [true, false] })
  public status: boolean

  @ApiProperty({ description: '关注的商家' })
  @prop({ ref: 'Admin' })
  public likingBusiness: Ref<Admin>[]

  @ApiProperty({ description: '关注的商家' })
  @prop({ ref: 'Goods' })
  public likingGoods: Ref<Goods>[]
}
