import { modelOptions, prop, Ref } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'
import Goods from './goods.model'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export default class Banner {
  @ApiProperty({ description: '商品图片' })
  @prop({required: true})
  public imgUrl: string

  @ApiProperty({ description: '状态' })
  @prop({})
  public status: boolean

  @ApiProperty({description: '商品'})
  @prop({ required: true, ref: 'Goods' })
  public goods: Ref<Goods>
}
