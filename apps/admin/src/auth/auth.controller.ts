import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Param,
  Put,
  Query,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger'
import { InjectModel } from 'nestjs-typegoose'
import { ReturnModelType } from '@typegoose/typegoose'
import { JwtService } from '@nestjs/jwt'

import RegisterDto from './dto/register.dto'
import LoginDto from './dto/login.dto'
import Admin from '@libs/db/model/admin.model'
import { LocalAuthGuard } from './guard/local.guard'
import { Forbiddent, Unauthorized } from '@libs/common/error/exception'
import { JwtInterface } from './interface/jwt.interface'
import { NotJwtAuthGuard } from '@libs/common/decorator/no-jwt-guard.decorator'
import { MailerService } from '@nestjs-modules/mailer'
import { RedisService } from 'nestjs-redis'

@Controller('auth')
@ApiTags('管理员')
export class AuthController {
  private client: any
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private readonly mailerService: MailerService,
    @InjectModel(Admin)
    private readonly adminModel: ReturnModelType<typeof Admin>,
  ) {}

  // 初始化 redis
  private async getClient(): Promise<void> {
    this.client = await this.redisService.getClient()
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @NotJwtAuthGuard()
  @ApiOperation({ summary: '登录' })
  async login(@Body() loginDto: LoginDto, @Req() req) {
    const user = req.user
    if (!user) throw new Forbiddent()

    if (user.role === 'business' && user.apply === 2)
      throw new Forbiddent('商家正在申请中...')

    /* token 令牌 */
    const payload: JwtInterface = { _id: user._id }
    const token = await this.jwtService.signAsync(payload)
    const userInfo = {
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
    }

    return { token, user: userInfo }
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: '删除商家' })
  async remove(@Param() param) {
    const user = await this.adminModel.findByIdAndDelete(param.id)

    // 通知商家被删除
    this.sendMailToUser({
      to: process.env.MAILER_MODULE_TO, // 因为是开发所以我把所有的接收者全改为自己的， 这里应该是商家的邮箱
      html: `非常抱歉, 你的商家号(${user.username})已被管理员删除！`,
      subject: '【海淘】 商家用户通知',
    })
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiBody({})
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: '编辑商家' })
  async update(@Param() param, @Body() body, @Req() req) {
    const user = req.user
    if (!user || (user.role !== 'admin' && user._id !== param.id)) {
      throw new Unauthorized('没有权限')
    }

    await this.adminModel.findByIdAndUpdate(param.id, body)
  }

  @Get('list')
  @ApiBearerAuth()
  @ApiOperation({ summary: '商家列表' })
  async getBusiness(@Query() query) {
    const { size, page, data } = query

    const { status, ...params } = data
      ? JSON.parse(data)
      : { status: undefined }

    let obj

    if (typeof status === 'boolean') obj = { status }
    if (JSON.stringify(params) !== '{}') {
      for (let key in params) {
        obj.$or = [{ [key]: new RegExp(params[key], 'i') }]
      }
    }

    // 搜索默认条件
    const findBusiness = { role: 'business', apply: 1 }

    const result = await this.adminModel
      .find({ ...obj, ...findBusiness })
      .skip(+(page - 1) * +size)
      .limit(+size)
      .select({ status: 1, username: 1, name: 1, avatar: 1, email: 1 })

    const total = await this.adminModel.countDocuments({
      ...obj,
      ...findBusiness,
    })

    return { data: result, total }
  }

  @Post('register')
  @NotJwtAuthGuard()
  @ApiOperation({ summary: '创建商家' })
  async register(@Body() registerDto: RegisterDto) {
    const { code, email, model } = registerDto

    if (code.toUpperCase() !== (await this.client.get(`${email}_${model}`)))
      throw new Forbiddent('验证码错误')
    delete registerDto.code

    await this.adminModel.create(registerDto)
  }

  @Get('role')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取管理员身份' })
  async getRole(@Req() req) {
    const user = req.user
    if (!user) throw new Unauthorized('token 错误')

    return { role: user.role }
  }

  @Post('sms')
  @NotJwtAuthGuard()
  @ApiOperation({ summary: '发送验证码' })
  async sms(@Body() body) {
    const { email, model } = body
    if (!this.client) await this.getClient()

    if (await this.client.get(`${email}_${model}`))
      throw new Forbiddent('请在 1 分钟后重新发送')

    const code = Math.random()
      .toString(16)
      .slice(2, 6)
      .toUpperCase()
    await this.client.set(`${email}_${model}`, code, 'EX', 60)

    this.sendMailToUser({
      to: process.env.MAILER_MODULE_TO,
      html: `<b>【海淘】验证码：(${code}), 该验证码1分钟内有效, 请勿泄露于他人！</b>`,
      subject: process.env.MAILER_MODULE_ON,
    })
  }

  @Get('applying')
  @ApiOperation({ summary: '正在申请的人' })
  async applying(@Query() query) {
    let { size, page, data } = query

    data = data ? JSON.parse(data) : {}

    // 查询的字段
    const selectColum = {
      username: 1,
      name: 1,
      avatar: 1,
      email: 1,
    }

    let obj

    if (JSON.stringify(data) !== '{}') {
      for (let key in data) {
        obj = {
          $or: [{ [key]: new RegExp(data[key], 'i') }],
        }
      }
    }

    const result = await this.adminModel
      .find({
        ...obj,
        apply: 2,
      })
      .skip(+(page - 1))
      .limit(+size)
      .select(selectColum)

    const total = await this.adminModel.countDocuments({
      ...obj,
      apply: 2,
    })

    return { data: result, total }
  }

  @Delete('refuse/:id')
  @ApiOperation({ summary: '拒绝申请' })
  async refuse(@Param() param) {
    await this.adminModel.findByIdAndDelete(param.id)

    this.sendMailToUser({
      to: process.env.MAILER_MODULE_TO,
      html: process.env.MAILER_MODULE_ERROR_MSG,
      subject: process.env.MAILER_MODULE_RESULT,
    })
  }

  @Put('agree/:id')
  @ApiOperation({ summary: '拒绝申请' })
  async agree(@Param() param) {
    await this.adminModel.findByIdAndUpdate(param.id, {
      apply: 1,
    })

    this.sendMailToUser({
      to: process.env.MAILER_MODULE_TO,
      html: process.env.MAILER_MODULE_SUCCESS_MSG,
      subject: process.env.MAILER_MODULE_RESULT,
    })
  }

  @Post('delAll')
  @ApiOperation({ summary: '批量删除商家' })
  async delAll(@Body() body) {
    await this.adminModel.remove({
      _id: { $in: body },
    })
  }

  // 发送邮箱
  sendMailToUser({ to, html, subject }) {
    this.mailerService.sendMail({
      to, // 接收信息的邮箱
      from: process.env.MAILER_MODULE_FROM, // 要发送邮件的邮箱
      subject,
      html,
      // template: 'email',
    })
  }
}
