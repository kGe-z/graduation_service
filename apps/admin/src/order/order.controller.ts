import Goods from '@libs/db/model/goods.model'
import Order from '@libs/db/model/order.model'
import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'

@Controller('order')
@ApiTags('订单')
export class OrderController {
  constructor(
    @InjectModel(Order)
    private readonly orderModel: ReturnModelType<typeof Order>,
    @InjectModel(Goods)
    private readonly goodsModel: ReturnModelType<typeof Goods>,
  ) {}

  @Post()
  @ApiOperation({ summary: '获取订单列表' })
  async list(@Req() req, @Body() body) {
    const user_id = req.user._id

    return await this.initOrderList(body, user_id)
  }

  @Post('search')
  @ApiOperation({ summary: '搜索' })
  async search(@Body() body, @Req() req) {
    const user_id = req.user._id
    const { refund, ...data } = body

    let key, value
    for (let o in data) {
      key = o
      value = data[key]
    }

    const reg = new RegExp(value, 'i')
    return await this.initOrderList(
      key
        ? {
            $or: [{ [key]: reg }],
          }
        : {},
      user_id,
      refund,
    )
  }

  @Get('refund')
  @ApiOperation({ summary: '申请退款' })
  async refund(@Req() req) {
    const res = await this.initOrderList({}, req.user._id, 1)
    return { data: res }
  }

  @Put()
  @ApiOperation({ summary: '同意/拒绝退款' })
  async editRefund(@Body() body) {
    const { cid, gid, refund, content } = body
    const res = JSON.parse(JSON.stringify(await this.orderModel.findById(cid)))

    res.goods.forEach(item => {
      if (item.good_id === gid) {
        item.refund = +refund

        if (content) item.content = content
      }
    })

    await this.orderModel.findByIdAndUpdate(cid, {
      goods: res.goods,
    })
  }

  async initOrderList(body, user_id, refund?) {
    let res = await this.orderModel
      .find(body)
      .select({
        address_id: 1,
        goods: 1,
        total_amount: 1,
        updatedAt: 1,
        out_trade_no: 1,
        user_id: 1,
      })
      .populate('address_id', 'address detailed phone name')
      .populate('user_id', 'avatar name')

    for (let i = 0; i < res.length; i++) {
      const current = res[i].goods
      res[i].total_amount = 0

      const arr = []
      for (let j = 0; j < current.length; j++) {
        const good = await this.goodsModel
          .findOne({
            _id: current[j].good_id,
            business: user_id,
          })
          .select({
            imgUrl: 1,
            name: 1,
            description: 1,
            business: 1,
            price: 1,
          })

        if (good) {
          if (refund == current[j].refund || typeof refund !== 'number') {
            arr.push({
              good,
              num: current[j].num,
              refund: current[j].refund,
              content: current[j].content,
            })
            res[i].total_amount += good.price *= current[j].num
          }
        }
      }

      if (arr.length > 0) {
        res[i].goods = arr
      } else {
        delete res[i]
      }
    }

    res = res.filter(s => s)

    return res
  }
}
