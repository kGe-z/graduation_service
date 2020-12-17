import Order from '@libs/db/model/order.model'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReturnModelType } from '@typegoose/typegoose'
import AlipaySdk from 'alipay-sdk'
import AlipayFormData from 'alipay-sdk/lib/form'
import { InjectModel } from 'nestjs-typegoose'
import * as fs from 'fs'
import { RedisService } from 'nestjs-redis'
import { JwtAuthGuard } from '../auth/guard/jwt.guard'
import { ParamsException, ServerException } from '@libs/common/error/exception'
import Goods from '@libs/db/model/goods.model'

@Controller('order')
@ApiTags('订单')
export class OrderController {
  private aliyunSdk: any
  private formData: any
  private client: any
  constructor(
    @InjectModel(Order)
    private readonly orderModel: ReturnModelType<typeof Order>,
    @InjectModel(Goods)
    private readonly goodsModel: ReturnModelType<typeof Goods>,
    private redisService: RedisService,
  ) {
    this.getAliyunSdk()
    this.getClient()
    this.getFormData()
  }

  // 初始化 redis
  private async getClient(): Promise<void> {
    this.client = await this.redisService.getClient()
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

  /**
   * 返回支付宝沙箱支付链接
   */
  @Post('post')
  @ApiBearerAuth()
  @ApiOperation({ summary: '支付' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async pay(@Body() body, @Req() req) {
    /* 前台数据
      goods: []
      count: 66.00
      address_id: ''
    */
    const { goods, address_id, total_amount } = body
    const user_id = req.user._id

    /* 删除购物车的商品 */
    const cart = JSON.parse(await this.client.get(`${user_id}_cart`))
    goods.map(good => {
      cart.map((item, index) => {
        if (good.good_id === item._id) cart.splice(index, 1)
      })
    })
    await this.client.set(`${user_id}_cart`, JSON.stringify(cart))

    /**
     * 返回支付链接（PC支付接口）
     */
    const date = Date.now()
    await // 配置回调接口
    this.formData.addField('notifyUrl', process.env.WEB_APY_NOTIFYURL) // 内网穿透通知商家
    this.formData.addField('returnUrl', process.env.WEB_APY_CART_RETURNURL) // 支付成功返回地址

    this.formData.addField('bizContent', {
      outTradeNo: date, // 【必选】商户订单号：64个字符内，包含数字，字母，下划线；需要保证在商户端不重复
      productCode: 'FAST_INSTANT_TRADE_PAY', // 【必选】销售产品码，目前仅支持 FAST_INSTANT_TRADE_PAY
      totalAmount: total_amount, // 【必选】订单总金额，精确到小数点后两位
      // totalAmount: '66.00', // 【必选】订单总金额，精确到小数点后两位
      subject: '海淘', // 【必选】 订单标题
      body: '让全球每个人都能享受科技带来的美好生活', // 【可选】订单描述
    })

    const data = {
      goods,
      address_id,
      total_amount: (+total_amount).toFixed(2),
      user_id,
      out_trade_no: date + '',
      del: false,
      status: 1,
    }

    await this.orderModel.create(data)
    /**
     * exec对应参数：
     * method（调用支付宝api）
     * params（api请求的参数（包含“公共请求参数”和“业务参数”））
     * options（validateSign，formData，log）
     */
    const result = await this.aliyunSdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData: this.formData },
    )

    // result 为可以跳转到支付链接的 url
    return result
  }

  /**
   * 重新支付订单
   */
  @Post('replypost/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '支付' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async replypay(@Body() body, @Param('id') id) {
    /* 前台数据
      goods: []
      count: 66.00
      address_id: ''
    */
    const { out_trade_no } = body
    // const user_id = req.user._id
    const order = await this.orderModel.findById(id).where({ out_trade_no })
    if (!order) throw new ParamsException()
    if (order.status !== 1) throw new ServerException('订单已支付或以退款成功')

    /**
     * 返回支付链接（PC支付接口）
     */
    await // 配置回调接口
    this.formData.addField('notifyUrl', process.env.WEB_APY_NOTIFYURL) // 内网穿透通知商家
    this.formData.addField('returnUrl', process.env.WEB_APY_ORDER_RETURNURL) // 支付成功返回地址

    this.formData.addField('bizContent', {
      outTradeNo: out_trade_no, // 【必选】商户订单号：64个字符内，包含数字，字母，下划线；需要保证在商户端不重复
      productCode: 'FAST_INSTANT_TRADE_PAY', // 【必选】销售产品码，目前仅支持 FAST_INSTANT_TRADE_PAY
      totalAmount: order.total_amount, // 【必选】订单总金额，精确到小数点后两位
      // totalAmount: '66.00', // 【必选】订单总金额，精确到小数点后两位
      subject: '海淘', // 【必选】 订单标题
      body: '让全球每个人都能享受科技带来的美好生活', // 【可选】订单描述
    })

    /**
     * exec对应参数：
     * method（调用支付宝api）
     * params（api请求的参数（包含“公共请求参数”和“业务参数”））
     * options（validateSign，formData，log）
     */
    const result = await this.aliyunSdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData: this.formData },
    )

    // result 为可以跳转到支付链接的 url
    return result
  }

  @Post('post/result')
  @ApiOperation({ summary: '支付成功' })
  async create(@Body() body) {
    try {
      const { out_trade_no } = body

      await this.orderModel.updateOne(
        {
          out_trade_no,
        },
        {
          status: 0,
        },
      )
    } catch (error) {
      throw new ServerException()
    }
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改订单' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async refund(@Body() body) {
    const { good_id, order_id, content } = body

    const order = await this.orderModel.findById(order_id)

    order.goods.map(good => {
      if (good.good_id === good_id) {
        good.refund = 1 // 0 退款成功 ； 1 申请退款 ； 2 付款成功 ; 3 拒绝退款
        good.content = content
      }
    })

    await this.orderModel.findByIdAndUpdate(order_id, {
      goods: order.goods,
      status: 2,
    })
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有订单' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async order(@Req() req) {
    const res = await this.orderModel
      .find({
        user_id: req.user._id,
        del: false,
      })
      .select({
        address_id: 1,
        goods: 1,
        total_amount: 1,
        updatedAt: 1,
        out_trade_no: 1,
        status: 1,
      })
      .populate('address_id', 'address detailed')

    for (let i = 0; i < res.length; i++) {
      const current = res[i].goods

      for (let j = 0; j < current.length; j++) {
        current[j].good_id = await this.goodsModel
          .findById(current[j].good_id)
          .select({
            imgUrl: 1,
            name: 1,
            description: 1,
            business: 1,
            price: 1,
          })
          .populate('business', 'name avatar')
      }
    }
    return res
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除订单' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async del(@Param('id') id) {
    await this.orderModel.findByIdAndRemove(id)
  }
}
