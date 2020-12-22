import Comment from '@libs/db/model/comment.model'
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Put,
  Param,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { InjectModel } from 'nestjs-typegoose'
import { ReturnModelType } from '@typegoose/typegoose'
import { JwtService } from '@nestjs/jwt'

import User from '@libs/db/model/user.model'
import {
  Forbiddent,
  NotFound,
  Unauthorized,
} from '@libs/common/error/exception'
import { JwtInterface } from './interface/jwt.interface'
import { MailerService } from '@nestjs-modules/mailer'
import { RedisService } from 'nestjs-redis'
import { JwtAuthGuard } from './guard/jwt.guard'
import { compareSync } from 'bcryptjs'

import * as Core from '@alicloud/pop-core' // 引入模块

@Controller('auth')
@ApiTags('用户')
export class AuthController {
  private client: any
  constructor(
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
    private redisService: RedisService,
    @InjectModel(User) private readonly userModel: ReturnModelType<typeof User>,
    @InjectModel(Comment)
    private readonly commentModel: ReturnModelType<typeof Comment>,
  ) {
    this.getClient()
  }

  // 初始化 redis
  private async getClient(): Promise<void> {
    this.client = await this.redisService.getClient()
  }

  @Post('login')
  @ApiOperation({ summary: '登录' })
  async login(@Body() body) {
    const query = {}

    for (let key in body) {
      if (key !== 'password') query[key] = body[key]
    }
    const user = await this.userModel.findOne(query).select('+password')

    if (!user) throw new Unauthorized('未找到该用户')
    if (!compareSync(body.password, user.password))
      throw new Unauthorized('密码错误')
    if (!user.status) throw new Unauthorized('用户已被禁止登录')

    /* token 令牌 */
    const payload: JwtInterface = { _id: user._id }
    const token = await this.jwtService.signAsync(payload)

    return {
      token,
      user: {
        sex: user.sex,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        likingGoods: user.likingGoods,
        likingBusiness: user.likingBusiness,
        likingComment: user.likingComment
      },
    }
  }

  @Post('phoneLogin')
  @ApiOperation({ summary: '手机登录' })
  async phoneLogin(@Body() body) {
    const { phone, code } = body
    await this.validataCode(phone, 'phone', code, true)

    let user = await this.userModel.findOne({ phone })
    if (!user) {
      body.password = '123456'
      body.name = '海淘用户-' + (phone + '').substring(phone.length - 4)
      delete body.code

      user = await this.userModel.create(body)
    }

    if (!user.status) throw new Unauthorized('用户已被禁止登录')

    /* token 令牌 */
    const payload: JwtInterface = { _id: user._id }
    const token = await this.jwtService.signAsync(payload)

    return {
      token,
      user: {
        sex: user.sex,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        likingGoods: user.likingGoods,
        likingBusiness: user.likingBusiness,
        likingComment: user.likingComment
      },
    }
  }

  @Post('register')
  @ApiOperation({ summary: '创建用户' })
  @ApiBody({})
  async register(@Body() body) {
    const { mode, code } = body

    await this.validataCode(body[mode], mode, code, true)

    delete body.mode
    delete body.code

    await this.userModel.create(body)
  }

  @Post('getCode')
  @ApiOperation({ summary: '验证码' })
  @ApiBody({})
  async getCode(@Body() body) {
    const { email, mode } = body
    if (!this.client) await this.getClient()

    if (await this.client.get(`${email}_${mode}`))
      throw new Forbiddent('请在一分钟后重新发送')

    const code = Math.random()
      .toString(16)
      .slice(2, 6)
      .toUpperCase()
    await this.client.set(`${email}_${mode}`, code, 'EX', 60)

    this.mailerService.sendMail({
      to: process.env.MAILER_MODULE_TO, // 接收信息的邮箱
      from: process.env.MAILER_MODULE_FROM, // 要发送邮件的邮箱
      subject: process.env.MAILER_MODULE_SUBJECT,
      html: `<b>【海淘】验证码：(${code}), 您正在使用邮箱验证码登录功能, 1分钟内有效。</b>`,
    })
  }

  @Post('phoneCode')
  @ApiOperation({ summary: '短信' })
  @ApiBody({})
  async phoneCode(@Body() body) {
    const { phone, mode } = body

    const client = new Core({
      accessKeyId: process.env.WEB_ACCESS_KEY_ID, // 你的阿里云短信服务accessKeyId
      accessKeySecret: process.env.WEB_ACCESS_KEY_SECRET, // 你的阿里云短信服务accessKeySecret
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25',
    })

    // 验证码
    const code = Math.random()
      .toString(16)
      .slice(2, 6)
      .toUpperCase()

    const params = {
      RegionId: 'cn-hangzhou',
      // PhoneNumbers: phone, // 电话号码
      PhoneNumbers: +process.env.WEB_PHONENUMBERS, // 电话号码
      SignName: process.env.WEB_SIGN_NAME, // 你的短信签名
      TemplateCode: process.env.WEB_TEMPLATE_CODE, // 你的短信模板代码
      TemplateParam: `{"code": "${code}"}`, // 短信模板变量对应的实际值，JSON格式
    }

    const requestOption = {
      method: 'POST',
    }

    await this.client.set(`${phone}_${mode}`, code, 'EX', 60)

    await client.request('SendSms', params, requestOption)
  }

  @Post('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async getInfo(@Req() req) {
    const user = req.user
    if (!user) throw new Unauthorized('token 错误')

    return user
  }

  @Put('pwd')
  @ApiOperation({ summary: '无登录修改密码' })
  async editPassword(@Body() body) {
    const { mode, code, username, password } = body
    await this.validataCode(username, mode, code)
    await this.userModel.updateOne({ [mode]: username }, { password })
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改账号密码' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async edit(@Req() req, @Body() body) {
    const user = req.user
    const { mode, code, data } = body

    await this.validataCode(data[mode] || user[mode], mode, code)
    await this.userModel.findByIdAndUpdate(user._id, data)
  }

  @Put('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改其余信息' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async editInfo(@Req() req, @Body() body) {
    const user = req.user

    await this.userModel.findByIdAndUpdate(user._id, body)
  }

  @Put('cart')
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置购物车' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async setCart(@Req() req, @Body() body) {
    await this.client.set(`${req.user._id}_cart`, JSON.stringify(body))
  }

  @Get('cart')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取购物车' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async getCart(@Req() req) {
    return JSON.parse(await this.client.get(`${req.user._id}_cart`))
  }

  @Put('follow/business/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏/取消收藏 商家' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async followBusiness(@Param('id') id, @Req() req) {
    const follow = req.user.likingBusiness
    const index = follow.findIndex(item => item.toString() === id)

    if (index === -1) follow.push(id)
    else follow.splice(index, 1)

    await this.userModel.findByIdAndUpdate(req.user._id, {
      likingBusiness: follow,
    })
  }

  @Put('follow/goods/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏/取消收藏 商品' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async followGoods(@Param('id') id, @Req() req) {
    const follow = req.user.likingGoods
    const index = follow.findIndex(item => item.toString() === id)

    if (index === -1) follow.push(id)
    else follow.splice(index, 1)

    await this.userModel.findByIdAndUpdate(req.user._id, {
      likingGoods: follow,
    })
  }

  @Put('follow/comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async like(@Req() req, @Param('id') id) {
    const follow = req.user.likingComment

    const index = follow.findIndex(item => item.toString() === id)

    if (index === -1) follow.push(id)
    else follow.splice(index, 1)

    await this.userModel.findByIdAndUpdate(req.user._id, {
      likingComment: follow,
    })

    await this.commentModel.findByIdAndUpdate(id, {
      $inc: { voteCount: index === -1 ? 1 : -1 },
    })
  }

  @Get('follow/business')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取收藏商家' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async GetFollowBusiness(@Req() req) {
    return await this.userModel
      .findById(req.user._id)
      .populate('likingBusiness')
      .select('likingBusiness')
  }

  @Get('follow/goods')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取收藏商品' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async GetFollowGoods(@Req() req) {
    return await this.userModel
      .findById(req.user._id)
      .select('likingGoods')
      .populate('likingGoods')
  }

  /* 比较验证码 */
  async validataCode(name, mode, code, flag = false) {
    const redis_code = await this.client.get(`${name}_${mode}`)

    if (!redis_code) throw new Forbiddent('验证码失效')
    if (redis_code !== code.toUpperCase()) throw new Forbiddent('验证码错误')

    const user = await this.userModel.findOne({ [mode]: name })

    if (!user && !flag) throw new NotFound('未找到该用户')
  }
}
