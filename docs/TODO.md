# TODO List

## 通用

- [x] 接入redux
- [ ] 接入Immutable.js
- [ ] 研究下shouldUpdate
- [x] 登录组件
- [x] 单点登录
- [ ] 安全/权限? 
- [ ] 把acl做成注解?
- [x] 表单项多了后输入卡顿: 研究下controlled input的render问题
- [x] 修改ajax util, 全部变成async/await
- [x] 想办法减小下bundle大小,或者分片
- [x] 自定义logger level

## 侧边栏组件

- [x] 侧边栏折叠
- [x] 侧边栏只能展开一级菜单
- [x] 升级antd解决hover的bug
- [x] 完善logo组件样式
- [ ] 增加logo图片
- [ ] 可能出现水平和垂直的滚动条

## Header组件

- [x] 精简header
- [x] 自定义菜单

## DBTable组件

- [ ] schema校验
- [ ] 数据校验
- [x] 根据schema自动生成VO和controller
- [ ] 图形化生成schema
- [x] 导入/导出
- [x] DBTable组件可配置
- [x] 单条update时, 将原始数据填入modal
- [x] dataSchema支持showType
- [ ] dataSchema支持外键约束
- [x] modal中的表单增加placeholder
- [ ] 导出时要打开新窗口: 研究下[FileSaver.js](https://github.com/eligrey/FileSaver.js/)
- [ ] 表格最后有一列自定义操作栏
- [ ] 似乎可以做成云端服务, 用户只需提供配置即可, 不需要自己编译
- [x] update时不是所有字段都要填

## 杂项

- [x] 面包屑导航
- [x] 拆解App/index.less
- [x] logo和footer可以做成全局配置
- [x] InputNumber组件报的warning - 不知是那个组件的版本有问题
- [x] favicon 404的问题
- [ ] add propType check
- [ ] 要请求ali cdn导致很慢, 图标加载不出来
- [ ] profile工具
- [ ] React Hot Loader 3
- [ ] prod环境下屏蔽redux-logger
- [ ] npm run build是不是没啥必要了
- [x] 更新react-java-goos
