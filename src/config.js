/**
 * 定义整个项目的全局配置
 */

module.exports = {
  name: 'ABC管理后台',  // 项目的名字
  footer: 'xxx版权所有 © 2015-2099',  // footer中显示的字

  debug: true,  // 是否开启debug模式

  api: {  // 对后端请求的相关配置
    host: '',  // 调用ajax接口的地址, 默认值空, 如果是跨域的, 服务端要支持CORS
    path: '/api',  // ajax请求的路径

    login: '/login',  // 用于校验用户是否登录的接口, 要返回当前登录的用户名
  },

}
