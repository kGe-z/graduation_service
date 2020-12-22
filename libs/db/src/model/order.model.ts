import { modelOptions, prop, Ref } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'

import Goods from '@libs/db/model/goods.model';
import Address from '@libs/db/model/address.model';
import User from '@libs/db/model/user.model';

@modelOptions({
  schemaOptions: { timestamps: true },
})
export default class Order {
  @ApiProperty({ description: '商品' })
  @prop()
  public goods: any

  @ApiProperty({ description: '地址' })
  @prop({ ref: 'Address' })
  public address_id: Ref<Address>

  @ApiProperty({ description: '用户' })
  @prop({ ref: 'User' })
  public user_id: Ref<User>

  @ApiProperty({ description: '总金额' })
  @prop({ required: true })
  public total_amount: number

  @ApiProperty({ description: '显示' })
  @prop({ default: false })
  public del: boolean

  @ApiProperty({ description: '状态' })
  @prop({ default: 1 }) // 0: 已支付; 1: 未支付; 2: 存在退款记录;
  public status: number

  @ApiProperty({ description: '订单号' })
  @prop()
  public out_trade_no: string
}
