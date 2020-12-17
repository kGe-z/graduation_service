import { NotJwtAuthGuard } from '@libs/common/decorator/no-jwt-guard.decorator'
import { ApiTags } from '@nestjs/swagger'

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { createWriteStream, statSync, mkdirSync } from 'fs'
import { join, isAbsolute, relative, sep } from 'path'

@Controller()
@NotJwtAuthGuard()
@ApiTags('默认')
export class AppController {
  constructor() {}
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) //使用上传拦截器，取到前端上传的文件名
  async upload(@UploadedFile('file') file, @Body() body) {
    const { op } = body
    const date = new Date()

    let month: string | number = date.getMonth() + 1
    let day: string | number = date.getDate()
    month = month > 9 ? month : '0' + month
    day = day > 9 ? day : '0' + day

    const imageUrl = `../../../uploads/${op}/${month}.${day}`

    this.mkdirfn(imageUrl, err => {})

    const timer = Date.now()
    const writeImage = createWriteStream(
      join(__dirname, imageUrl, `${timer}_${file.originalname}`),
    )
    writeImage.write(file.buffer)

    return {
      imgUrl: `http://localhost:${
        process.env.APP_SERVER_PORT
      }/uploads/${op}/${month}.${day}/${timer}_${file.originalname}`,
    }
  }

  mkdirfn(pathname, cb) {
    // 是否为绝对路径
    pathname = isAbsolute(pathname) ? pathname : join(__dirname, pathname)
    // 获取相对路径
    pathname = relative(__dirname, pathname)
    const floders = pathname.split(sep)

    let pre = ''
    floders.forEach(floder => {
      try {
        const stat = statSync(join(__dirname, pre, floder))
        const hasMkidr = stat && stat.isDirectory()

        if (hasMkidr) cb
      } catch (error) {
        try {
          mkdirSync(join(__dirname, pre, floder))
          cb && cb(null)
        } catch (error) {
          cb && cb(error)
        }
      }
      pre = join(pre, floder)
    })
  }
}
