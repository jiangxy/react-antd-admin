/**
 * 定义整个项目的全局配置
 */

'use strict';

// 约定优于配置
// 我可以提供尽量多的配置, 但尽量不要太个性化, 接口的路径/名称/格式之类的
// 遵循统一的规范, 好维护, 交给其他人也比较简单

module.exports = {
  name: 'OOXX管理后台',  // 项目的名字
  favicon: 'http://jxy.me/favicon.ico',  // 设置网页的favicon, 可以是外链, 也可以是本地
  footer: '<a target="_blank" href="http://jxy.me">foolbear</a>版权所有 © 2015-2099',  // footer中显示的字, 可以嵌入html标签

  debug: true,  // 是否开启debug模式, 不会请求后端接口, 使用mock的数据

  tabMode: {  // tab模式相关配置
    enable: false,  // 是否开启tab模式
    allowDuplicate: false,  // 同一个菜单项只允许一个tab
  },

  log: {
    level: 'info',  // 日志级别, 类似slf4j中的root logger, 目前支持debug/info/warn/error 4种级别
    // 除了root logger以外, 也可以为每个logger单独设置级别
    debug: [],
    info: [],
    warn: [],
    error: ['loggerA', 'loggerB'],  // 示例, 对于loggerA和loggerB使用error级别, 其他logger使用默认的info级别
  },

  api: {  // 对后端请求的相关配置
    host: 'http://localhost:12345',  // 调用ajax接口的地址, 默认值空, 如果是跨域的, 服务端要支持CORS
    path: '/api',  // ajax请求的路径
    timeout: 15000,  // 请求的超时时间, 单位毫秒
  },

  login: {  // 登录相关配置
    getCurrentUser: '/getCurrentUser',  // 后端必须要提供接口校验当前用户的身份, 如果拿不到用户信息, 才会尝试登录

    // 登录有两种情况:

    // 1. 使用sso登录, 直接跳转就可以了
    sso: '',  // 是否使用单点登录? 是的话我会把地址encode后加到后面, 然后跳转, 如果这个是空字符串, 说明不使用单点登录
    // 2. 不使用sso, 使用我提供的一个登录界面
    validate: '/login',  // 校验用户信息, 表单的submit地址. 如果登录成功, 必须返回用户名

    logout: '/logout',  // 退出的url, 用户点击退出时, 浏览器会直接跳转到这个链接
  },

  upload: {  // 上传相关配置
    // 上传图片和上传普通文件分别配置
    image: '/uploadImage',  // 默认的上传图片接口
    imageSizeLimit: 1500,  // 默认的图片大小限制, 单位KB

    file: '/uploadFile',  // 默认的上传文件的接口
    fileSizeLimit: 10240,  // 默认的文件大小限制, 单位KB
  },

  sidebar: {  // 侧边栏相关配置
    collapsible: true,  // 是否显示折叠侧边栏的按钮
    autoMenuSwitch: true,  // 只展开一个顶级菜单, 其他顶级菜单自动折叠
  },

  DBTable: {  // DBTable组件相关配置
    pageSize: 50, // 表格每页显示多少条数据
    showSizeChanger: true, // 是否可以修改每页显示多少条数据
    pageSizeOptions: ['10', '20', '50', '100'], // 指定每页可以显示多少条

    default: {  // 针对每个表格的默认配置
      showExport: true,  // 显示导出按钮, 默认true
      showImport: true,  // 显示导入按钮, 默认true
      showInsert: true,  // 显示新增按钮, 默认true
      showUpdate: true,  // 显示修改按钮, 默认true
      showDelete: true,  // 显示删除按钮, 默认true

      asyncSchema: false,  // 是否从服务端加载schema, 默认false
      ignoreSchemaCache: false,  // 是否忽略schema的缓存, 对于异步schema而言, 默认只会请求一次后端接口然后缓存起来
    },
  },

  // 以下一些辅助的函数, 不要修改
  // 不能使用箭头函数, 会导致this是undefined

  /**
   * 是否要跨域请求
   *
   * @returns {boolean}
   */
  isCrossDomain() {
    if (this.api.host && this.api.host !== '') {
      return true;
    } else {
      return false;
    }
  },

  /**
   * 是否单点登录
   *
   * @returns {boolean}
   */
  isSSO() {
    if (this.login.sso && this.login.sso !== '') {
      return true;
    } else {
      return false;
    }
  },

  /**
   * 获得api请求的路径
   *
   * @returns {*}
   */
  getAPIPath() {
    if (this.tmpApiPath) { // 缓存
      return this.tmpApiPath;
    }

    const paths = [];

    // js的字符串处理真是麻烦
    if (this.isCrossDomain()) {
      // 去除结尾的'/'
      const tmp = this.api.host;
      let index = tmp.length - 1;
      // 如果超出指定的 index 范围，charAt返回一个空字符串
      while (tmp.charAt(index) === '/') {
        index--;
      }
      if (index < 0)
        paths.push('');
      else
        paths.push(tmp.substring(0, index + 1));
    } else {
      paths.push('');
    }

    if (this.api.path) {
      const tmp = this.api.path;
      let begin = 0;
      let end = tmp.length - 1;

      while (tmp.charAt(begin) === '/') {
        begin++;
      }
      while (tmp.charAt(end) === '/') {
        end--;
      }
      if (begin > end)
        paths.push('');
      else
        paths.push(tmp.substring(begin, end + 1));
    } else {
      paths.push('');
    }

    const tmpApiPath = paths.join('/');
    this.tmpApiPath = tmpApiPath;
    return tmpApiPath;
  },

};
