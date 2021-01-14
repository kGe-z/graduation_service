import Goods from '@libs/db/model/goods.model'
import Order from '@libs/db/model/order.model'
import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReturnModelType } from '@typegoose/typegoose'
import AlipaySdk from 'alipay-sdk'
import { InjectModel } from 'nestjs-typegoose'
import * as fs from 'fs'
import AlipayFormData from 'alipay-sdk/lib/form'
import * as request from 'request'

@Controller('order')
@ApiTags('订单')
export class OrderController {
  private aliyunSdk: any
  private formData: any
  constructor(
    @InjectModel(Order)
    private readonly orderModel: ReturnModelType<typeof Order>,
    @InjectModel(Goods)
    private readonly goodsModel: ReturnModelType<typeof Goods>,
  ) {
    this.getAliyunSdk()
    this.getFormData()
  }
  //初始化阿里实例化对象
  getAliyunSdk(): void {
    this.aliyunSdk = new AlipaySdk({
      appId: process.env.WEB_APY_APP_ID, // 开放平台上创建应用时生成的 appId
      signType: 'RSA2', // 签名算法,默认 RSA2
      gateway: 'https://openapi.alipaydev.com/gateway.do', // 支付宝网关地址 ，沙箱环境下使用时需要修改
      alipayPublicKey: fs.readFileSync(
        'config/pem/alipay_public_key.pem',
        'ascii',
      ), // 支付宝公钥，需要对结果验签时候必填
      privateKey: fs.readFileSync('config/pem/private-key.pem', 'ascii'), // 应用私钥字符串
    })
  }

  // 初始化支付宝提交表单
  getFormData(): void {
    this.formData = new AlipayFormData()
    this.formData.setMethod('get')
    this.formData.addField('appId', process.env.WEB_APY_APP_ID)
    this.formData.addField('charset', 'utf-8')
    this.formData.addField('signType', 'RSA2')
  }

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
    const { cid, gid, refund, content, price } = body

    const res = JSON.parse(JSON.stringify(await this.orderModel.findById(cid)))

    if (+refund === 0) {
      const { out_trade_no } = res

      // 键唯一
      let trade = ''
      for (let i = 0; i < 3; i++) {
        trade += Math.round(Math.random() * 10)
      }
      const out_request_no = Date.now() + trade

      this.formData.addField('bizContent', {
        outTradeNo: out_trade_no, // 【必选】商户订单号：64个字符内，包含数字，字母，下划线；需要保证在商户端不重复
        productCode: 'FAST_INSTANT_TRADE_PAY', // 【必选】销售产品码，目前仅支持 FAST_INSTANT_TRADE_PAY
        refundAmount: (+price).toFixed(2), // 【必选】订单总金额，精确到小数点后两位
        out_request_no,
      })

      const result = await this.aliyunSdk.exec(
        'alipay.trade.refund',
        {},
        { formData: this.formData },
      )
      console.log(result);
      
      request(result)
    }

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
        status: 1
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
