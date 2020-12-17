import Admin from '@libs/db/model/admin.model'
import Banner from '@libs/db/model/banner.model'
import Goods from '@libs/db/model/goods.model'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { JwtAuthGuard } from '../auth/guard/jwt.guard'

@Controller('goods')
@ApiTags('商品')
export class GoodsController {
  constructor(
    @InjectModel(Goods)
    private readonly goodsModel: ReturnModelType<typeof Goods>,
    @InjectModel(Banner)
    private readonly bannerModel: ReturnModelType<typeof Banner>,
    @InjectModel(Admin)
    private readonly adminModel: ReturnModelType<typeof Admin>,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: '获取商品' })
  async info(@Param('id') id) {
    return await this.goodsModel
      .findById(id)
      .where({ status: true })
      .select({
        imgUrl: 1,
        name: 1,
        description: 1,
        old_price: 1,
        price: 1,
        stock: 1,
      })
      .populate('business', 'avatar name')
  }

  @Post()
  @ApiOperation({ summary: '获取商品' })
  async list(@Body() body) {
    const { page, c } = body
    const data = await this.goodsModel
      .find({
        category: +c,
      })
      .skip((page - 1) * 20)
      .limit(20)
      .populate('business', 'avatar name')

    const total = await this.goodsModel.find({ category: +c }).countDocuments()

    return { data, total }
  }

  @Post('search')
  @ApiOperation({ summary: '搜索商品' })
  async search(@Body() body) {
    const { page, q } = body

    const reg = new RegExp(q, 'ig')
    const data = await this.goodsModel
      .find({
        $or: [{ name: { $regex: reg } }],
      })
      .skip((page - 1) * 20)
      .limit(20)
      .populate('business', 'avatar name')

    const total = await this.goodsModel
      .find({
        $or: [{ name: { $regex: reg } }],
      })
      .countDocuments()

    return { data, total }
  }

  @Post('list')
  @ApiOperation({ summary: '首页' })
  async homeList() {
    const goods = []
    for (let i = 0; i < 7; i++) {
      const current = await this.goodsModel.find({ category: i }).limit(10)
      goods.push(current)
    }

    const hot = await this.goodsModel.aggregate([{ $sample: { size: 10 } }])
    const banner = await this.bannerModel.find()

    return {
      hot,
      goods,
      banner,
    }
  }

  @Post('business/:id')
  @ApiOperation({ summary: '商家商品' })
  async business(@Param('id') id, @Body() body) {
    const { page, c } = body

    const result = await this.goodsModel
      .find({ business: id, category: +c })
      .skip((+page - 1) * 20)
      .limit(20)
      .populate('business')

    const total = await this.goodsModel.countDocuments({
      business: id,
      category: +c,
    })

    return { data: result, total }
  }

  @Post('business/:id/search')
  @ApiOperation({ summary: '搜索商家商品' })
  async businessSearch(@Param('id') id, @Body() body) {
    const { page, keyword } = body

    const reg = new RegExp(keyword, 'i')

    const result = await this.goodsModel
      .find({
        business: id,
        $or: [{ name: { $regex: reg } }],
      })
      .skip((+page - 1) * 20)
      .limit(20)
      .populate('business')

    const total = await this.goodsModel.countDocuments({
      business: id,
      $or: [{ name: { $regex: reg } }],
    })

    return { data: result, total }
  }

  @Get('business/:id/info')
  @ApiOperation({ summary: '商家信息' })
  async businessInfo(@Param('id') id) {
    return await this.adminModel.findById(id)
  }
}
