import { modelOptions, prop, Ref } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'
import User from './user.model'
import Goods from './goods.model'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export default class Comment {
  @ApiProperty({ description: '商品' })
  @prop({ required: true, ref: 'Goods' })
  public goods: Ref<Goods>

  @ApiProperty({ description: '评论人' })
  @prop({ required: true, ref: 'User' })
  public commentator: Ref<User>

  @ApiProperty({ description: '第一个评论' })
  @prop({})
  public rootComment: string

  @ApiProperty({ description: '回复给哪个用户' })
  @prop({ ref: 'User' })
  public replyTo: Ref<User>

  @ApiProperty({ description: '内容' })
  @prop({})
  public content: string

  @ApiProperty({ description: '被赞次数' })
  @prop({ default: 0 })
  public voteCount: number
}
