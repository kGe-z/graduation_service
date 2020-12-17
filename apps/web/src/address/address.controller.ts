import { Unauthorized } from '@libs/common/error/exception'
import Address from '@libs/db/model/address.model'
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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { JwtAuthGuard } from '../auth/guard/jwt.guard'

@Controller('address')
@ApiTags('地址')
export class AddressController {
  constructor(
    @InjectModel(Address)
    private readonly addressModel: ReturnModelType<typeof Address>,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有地址' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  @ApiBody({})
  async all(@Req() req) {
    const user_id = req.user._id

    return await this.addressModel.find({ user_id }).sort({ default: -1 })
  }

  @Get('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有地址' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  @ApiBody({})
  async defaultInfo(@Req() req) {
    const user_id = req.user._id

    return await this.addressModel.findOne({ user_id, default: true }).select({
      address: 1
    })
  }
  
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取指定地址' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  @ApiBody({})
  async info(@Param('id') id, @Req() req) {
    const user_id = req.user._id

    return await this.addressModel.findById({
      _id: id,
      user_id,
    })
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建地址' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  @ApiBody({})
  async register(@Body() body, @Req() req) {
    const user_id = req.user._id

    if (body.default) {
      await this.addressModel.findOneAndUpdate(
        { default: true },
        { default: false },
      )
    }

    await this.addressModel.create({ ...body, user_id })
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改地址' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  @ApiBody({})
  async edit(@Param('id') id, @Body() body, @Req() req) {
    const user_id = req.user._id
    const address = await this.addressModel.findById(id)

    if (address.user_id.toString() !== user_id.toString())
      throw new Unauthorized()

    if (body.default) {
      await this.addressModel.findOneAndUpdate(
        { default: true },
        { default: false },
      )
    }

    await this.addressModel.findByIdAndUpdate(id, body)
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除地址' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  @ApiBody({})
  async del(@Param('id') id, @Req() req) {
    const user_id = req.user._id

    const address = await this.addressModel.findById(id)
    if (address.user_id !== user_id) throw new Unauthorized()

    await this.addressModel.findByIdAndDelete(id)
  }

}
