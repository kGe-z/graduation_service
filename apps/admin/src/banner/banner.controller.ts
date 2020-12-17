import Banner from '@libs/db/model/banner.model'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'

@Controller('banner')
@ApiTags('轮播图')
export class BannerController {
  constructor(
    @InjectModel(Banner)
    private readonly bannerModel: ReturnModelType<typeof Banner>,
  ) {}

  @Get('list')
  @ApiOperation({ summary: '轮播图列表' })
  async list(@Query() query) {
    const { size, page, data } = query
    const { status, good_name } = data
      ? JSON.parse(data)
      : { status: undefined, good_name: undefined }

    const selectColum = {
      status: 1,
      imgUrl: 1,
    }

    const queryData = {
      path: 'goods',
      select: { name: 1, category: 1 },
    }

    /* 如果存在商品名 则 */
    if (good_name) {
      queryData['match'] = { name: { $regex: new RegExp(good_name, 'i') } }
    }
    
    const result = (await this.bannerModel
      .find(typeof status === 'boolean' ? { status } : {})
      .populate(queryData)
      .skip(+page - 1)
      .limit(+size)
      .select(selectColum)).filter(itme => itme.goods)

    return { data: result, total: result.length }
  }

  @Post()
  @ApiOperation({ summary: '创建轮播图' })
  async create(@Body() body) {
    await this.bannerModel.create(body)
  }

  @Get(':id')
  @ApiOperation({ summary: '轮播图详情' })
  async getBanner(@Param('id') id) {
    return await this.bannerModel
      .findById(id)
      .populate('goods', { name: 1, category: 1 })
  }

  @Put(':id')
  @ApiOperation({ summary: '修改轮播图' })
  async update(@Param('id') id, @Body() body) {
    await this.bannerModel.findByIdAndUpdate(id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除轮播图' })
  async remove(@Param('id') id) {
    await this.bannerModel.findByIdAndDelete(id)
  }
}
