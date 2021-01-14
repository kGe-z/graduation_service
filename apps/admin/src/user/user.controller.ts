import User from '@libs/db/model/user.model'
import {
  Controller,
  Get,
  Query,
  Delete,
  Param,
  Put,
  Body,
  Post,
} from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'

@Controller('user')
@ApiTags('用户')
@ApiBearerAuth()
export class UserController {
  constructor(
    @InjectModel(User) private readonly userModel: ReturnModelType<typeof User>,
  ) {}

  @Get('list')
  @ApiOperation({ summary: '获取列表' })
  async list(@Query() query) {
    const { size, page, data } = query

    const { status, ...params } = data
      ? JSON.parse(data)
      : { status: undefined }

    const selectColum = {
      name: 1,
      username: 1,
      status: 1,
      avatar: 1,
      email: 1,
      phone: 1,
    }

    let obj = {}

    if (typeof status === 'boolean') obj = { status }
    if (JSON.stringify(params) !== '{}') {
      for (let key in params) {
        obj['$or'] = [{ [key]: new RegExp(params[key], 'i') }]
      }
    }

    const result = await this.userModel
      .find(obj)
      .skip(+(page - 1) * +size)
      .limit(+size)
      .select(selectColum)
    const total = await this.userModel.countDocuments(obj)

    return { data: result, total }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户' })
  async info(@Param('id') id) {
    return await this.userModel.findById(id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id') id) {
    await this.userModel.findByIdAndRemove(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '修改用户' })
  async update(@Param('id') id, @Body() body) {
    await this.userModel.findByIdAndUpdate(id, body)
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  async add(@Body() body) {
    await this.userModel.create(body)
  }

  @Post('delAll')
  @ApiOperation({ summary: '批量删除用户' })
  async delAll(@Body() body) {
    await this.userModel.remove({
      _id: { $in: body },
    })
  }
}
