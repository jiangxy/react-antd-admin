/*
 * 定义整个项目的全局配置
 */

module.exports = {
  name: 'XX管理后台',  // 项目的名字
  footer: 'xxx版权所有 © 2015-2099',  // footer中显示的字

  apiHost: '',  // 调用ajax接口的地址, 默认值空, 如果是跨域的, 服务端要支持CORS
  apiPath: '/api',  // ajax请求的路径

  loginValidate: '/login/validate',  // 用于校验用户是否登录的接口
}
