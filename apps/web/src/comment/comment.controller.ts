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
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { InjectModel } from 'nestjs-typegoose'
import { ReturnModelType } from '@typegoose/typegoose'
import Comment from '@libs/db/model/comment.model'
import Goods from '@libs/db/model/goods.model'
import { JwtAuthGuard } from 'apps/admin/src/auth/guard/jwt.guard'
import { Unauthorized } from '@libs/common/error/exception'

@Controller('comment')
@ApiTags('评论')
export class CommentController {
  constructor(
    @InjectModel(Goods)
    private readonly goodsModel: ReturnModelType<typeof Goods>,
    @InjectModel(Comment)
    private readonly commentModel: ReturnModelType<typeof Comment>,
  ) {}

  @Post(':gid')
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建商品一级评论' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async create(@Param('gid') id, @Body() body, @Req() req) {
    try {
      const commentator = req.user._id
      const goods = id

      await this.commentModel.create({
        commentator,
        goods,
        ...body,
      })
    } catch (error) {}
  }

  @Get(':gid')
  @ApiOperation({ summary: '获取商品评论' })
  async commonList(@Param('gid') gid) {
    const goods = gid

    const root = JSON.parse(
      JSON.stringify(
        await this.commentModel
          .find({
            goods,
            rootComment: null,
          })
          .populate('commentator'),
      ),
    )

    for (let i = 0; i < root.length; i++) {
      root[i].children = await this.commentModel
        .find({
          goods,
          rootComment: root[i]._id,
        })
        .populate('commentator replyTo')
    }

    return root
  }

  @Delete(':cid')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论' })
  @UseGuards(JwtAuthGuard) // jwt 验证
  async del(@Param('cid') id, @Req() req) {
    const commentator = req.user._id
    
    if (this.Compare(commentator, id)) {
      await this.commentModel.findByIdAndRemove(id)
    }
  }

  async Compare(uid, cid) {
    const comment = await this.commentModel.findById(cid)
    if (JSON.stringify(comment.commentator) !== JSON.stringify(uid))
      throw new Unauthorized()

    return true
  }
}
