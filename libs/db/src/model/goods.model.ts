import { modelOptions, prop, Ref } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'
import Admin from './admin.model'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export default class Goods {
  @ApiProperty({ description: '商品名称' })
  @prop({ required: true })
  public name: string

  @ApiProperty({ description: '商品图片' })
  @prop({ required: true })
  public imgUrl: string

  @ApiProperty({ description: '描述' })
  @prop({})
  public description: string

  @ApiProperty({ required: true, description: '价格' })
  @prop({})
  public price: number

  @ApiProperty({ description: '旧价格' })
  @prop({})
  public old_price: number

  @ApiProperty({ description: '库存' })
  @prop({})
  public stock: number

  @ApiProperty({ description: '状态' })
  @prop({})
  public status: boolean

  @ApiProperty({ description: '类型' })
  @prop({ required: true })
  public category: number

  @ApiProperty({ description: '商家' })
  @prop({ required: true, ref: 'Admin' })
  public business: Ref<Admin>

  @ApiProperty({ description: '访问量' })
  @prop({ default: 0 })
  public visits: number
}
