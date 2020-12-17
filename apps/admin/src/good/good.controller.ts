import { Forbiddent } from '@libs/common/error/exception'
import Goods from '@libs/db/model/goods.model'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'

@Controller('goods')
@ApiTags('商品')
export class GoodController {
  constructor(
    @InjectModel(Goods)
    private readonly goodsModel: ReturnModelType<typeof Goods>,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建商品' })
  async create(@Body() body, @Req() req) {
    if (req.user.role !== 'business') throw new Forbiddent('没有权限')
    const business = req.user._id
    await this.goodsModel.create({ ...body, business })
  }

  @Put('/:id')
  @ApiOperation({ summary: '更新商品' })
  async update(@Param('id') id, @Req() req, @Body() body) {
    const user = req.user
    const good = await this.goodsModel.findById(id)
    if (user.role !== 'admin' && String(good.business) !== String(user._id))
      throw new Forbiddent('没有权限')

    await this.goodsModel.findByIdAndUpdate(id, body)
  }

  @Delete('/:id')
  @ApiOperation({ summary: '删除商品' })
  async remove(@Param('id') id, @Req() req) {
    const user = req.user
    const good = await this.goodsModel.findById(id)
    if (user.role !== 'admin' && String(good.business) !== String(user._id))
      throw new Forbiddent('没有权限')

    await this.goodsModel.findByIdAndDelete(id)
  }

  @Get('list')
  @ApiOperation({ summary: '商品列表' })
  async list(@Req() req, @Query() query) {
    const business = req.user._id
    const { size, page, data } = query
    const { name, ...params } = data ? JSON.parse(data) : { name: undefined }

    const selectColum = {
      name: 1,
      imgUrl: 1,
      price: 1,
      old_price: 1,
      status: 1,
      category: 1,
      stock: 1,
    }

    const queryData = {
      business,
      ...params,
    }

    if (name) queryData.$or = [{ name: { $regex: new RegExp(name, 'i') } }]

    const result = await this.goodsModel
      .find(data ? queryData : { business })
      .skip(+(page - 1) * +size)
      .limit(+size)
      .select(selectColum)

    const total = await this.goodsModel.countDocuments(queryData)

    return { data: result, total }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取id信息' })
  async listById(@Req() req, @Param('id') id) {
    const user = req.user
    const good = await this.goodsModel.findById(id)
    if (user.role !== 'admin' && String(good.business) !== String(user._id))
      throw new Forbiddent('没有权限')

    return good
  }

  @Post('delAll')
  @ApiOperation({ summary: '批量删除商品' })
  async delAll(@Body() body, @Req() req) {
    await this.goodsModel.remove({
      _id: { $in: body },
      business: req.user._id,
    })
  }

  @Post('goodsList')
  @ApiOperation({ summary: '购物车分类列表' })
  async goodsList(@Body() body) {
    return await this.goodsModel
      .find({
        category: body.category,
        status: true,
      })
      .select({
        name: 1,
      })
  }
}
