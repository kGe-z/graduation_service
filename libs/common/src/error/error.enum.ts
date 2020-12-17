/* 自定义异常枚举 */
export enum ErrorTypeEnum {
  ERROR_TYPE_DEFAULT = 500,
  ERROR_TYPE_400 = 400,
  ERROR_TYPE_401 = 401,
  ERROR_TYPE_403 = 403,
  ERROR_TYPE_404 = 404,
}

/* 常用异常默认信息枚举 */
export enum ErrorValueEnum {
  ERROR_TYPE_DEFAULT = '服务器错误',
  ERROR_TYPE_400 = '请求参数错误',
  ERROR_TYPE_401 = '授权失败',
  ERROR_TYPE_403 = '禁止访问',
  ERROR_TYPE_404 = '资源未找到',
}